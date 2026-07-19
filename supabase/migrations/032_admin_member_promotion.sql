-- Admin user management backed by existing member identities.
--
-- Rollback notes:
-- - Before this feature is used, the four public RPCs and two private helpers can
--   be dropped, followed by the added columns/index/constraints.
-- - After admin/member links or role-assignment metadata exist, prefer a
--   corrective forward migration. Dropping the columns would discard provenance.
-- - Admin rows are intentionally soft-deactivated; audit rows are never removed.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS member_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_users_member_id_fkey'
      AND conrelid = 'admin_users'::regclass
  ) THEN
    ALTER TABLE admin_users
      ADD CONSTRAINT admin_users_member_id_fkey
      FOREIGN KEY (member_id)
      REFERENCES members(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_users_member_id
  ON admin_users(member_id)
  WHERE member_id IS NOT NULL;

ALTER TABLE admin_user_roles
  ADD COLUMN IF NOT EXISTS assigned_by_admin_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_user_roles_assigned_by_admin_id_fkey'
      AND conrelid = 'admin_user_roles'::regclass
  ) THEN
    ALTER TABLE admin_user_roles
      ADD CONSTRAINT admin_user_roles_assigned_by_admin_id_fkey
      FOREIGN KEY (assigned_by_admin_id)
      REFERENCES admin_users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION _assert_admin_user_manager(p_actor_admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF p_actor_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM admin_users AS actor
    JOIN admin_user_roles AS actor_role
      ON actor_role.admin_id = actor.id
    JOIN roles AS role
      ON role.id = actor_role.role_id
    LEFT JOIN role_permissions AS role_permission
      ON role_permission.role_id = role.id
    LEFT JOIN permissions AS permission
      ON permission.id = role_permission.permission_id
    WHERE actor.id = p_actor_admin_id
      AND actor.status = 'active'
      AND (
        role.name = 'super_admin'
        OR permission.code = 'admin_users.manage'
      )
  ) THEN
    RAISE EXCEPTION 'Admin user management permission is required'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION _active_super_admin_count(p_exclude_admin_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(DISTINCT admin.id)::INTEGER
  FROM admin_users AS admin
  JOIN admin_user_roles AS admin_role
    ON admin_role.admin_id = admin.id
  JOIN roles AS role
    ON role.id = admin_role.role_id
  WHERE admin.status = 'active'
    AND role.name = 'super_admin'
    AND (p_exclude_admin_id IS NULL OR admin.id <> p_exclude_admin_id);
$$;

CREATE OR REPLACE FUNCTION admin_promote_member(
  p_member_id UUID,
  p_role TEXT,
  p_status TEXT,
  p_code TEXT,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_admin admin_users%ROWTYPE;
  v_role_id UUID;
  v_issued_at TIMESTAMPTZ := NOW();
BEGIN
  PERFORM _assert_admin_user_manager(p_actor_admin_id);
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-user-management', 0));

  IF COALESCE(p_code, '') !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'Admin code must contain exactly four digits'
      USING ERRCODE = '22023';
  END IF;
  IF p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid admin status' USING ERRCODE = '22023';
  END IF;

  SELECT id
  INTO v_role_id
  FROM roles
  WHERE name = p_role
    AND name IN ('super_admin', 'president', 'secretary', 'treasurer', 'collector', 'viewer');

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Invalid admin role' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_member
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_member.status <> 'active' THEN
    RAISE EXCEPTION 'Only an active member can be promoted to admin'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM admin_users
    WHERE member_id = v_member.id
       OR phone = v_member.phone
  ) THEN
    RAISE EXCEPTION 'This member or phone is already linked to an admin account'
      USING ERRCODE = '23505';
  END IF;

  IF p_role = 'super_admin'
    AND p_status = 'active'
    AND _active_super_admin_count() >= 2
  THEN
    RAISE EXCEPTION 'A maximum of two active Super Admins is allowed'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO admin_users (
    member_id,
    phone,
    name,
    pin_hash,
    status
  ) VALUES (
    v_member.id,
    v_member.phone,
    v_member.name,
    extensions.crypt(p_code, extensions.gen_salt('bf', 12)),
    p_status::admin_status
  )
  RETURNING * INTO v_admin;

  INSERT INTO admin_user_roles (
    admin_id,
    role_id,
    assigned_by_admin_id
  ) VALUES (
    v_admin.id,
    v_role_id,
    p_actor_admin_id
  );

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'admin.promoted_from_member',
    'admin',
    v_admin.id::TEXT,
    'Member promoted to admin',
    'warning',
    NULL,
    jsonb_build_object(
      'memberId', v_member.id,
      'name', v_admin.name,
      'phone', v_admin.phone,
      'role', p_role,
      'status', v_admin.status
    ),
    p_ip,
    p_device
  );

  RETURN jsonb_build_object(
    'adminId', v_admin.id,
    'issuedAt', v_issued_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_user_role_status(
  p_admin_id UUID,
  p_role TEXT,
  p_status TEXT,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_role_id UUID;
  v_before_roles JSONB;
  v_before_status TEXT;
  v_before_active_super BOOLEAN;
  v_after_active_super BOOLEAN;
  v_same_role BOOLEAN;
BEGIN
  PERFORM _assert_admin_user_manager(p_actor_admin_id);
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-user-management', 0));

  IF p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid admin status' USING ERRCODE = '22023';
  END IF;

  SELECT id
  INTO v_role_id
  FROM roles
  WHERE name = p_role
    AND name IN ('super_admin', 'president', 'secretary', 'treasurer', 'collector', 'viewer');

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Invalid admin role' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_admin
  FROM admin_users
  WHERE id = p_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_admin_id = p_actor_admin_id AND p_status = 'inactive' THEN
    RAISE EXCEPTION 'You cannot deactivate your own admin account'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(jsonb_agg(role.name ORDER BY role.name), '[]'::JSONB)
  INTO v_before_roles
  FROM admin_user_roles AS admin_role
  JOIN roles AS role ON role.id = admin_role.role_id
  WHERE admin_role.admin_id = p_admin_id;

  SELECT
    COUNT(*) = 1
    AND COUNT(*) FILTER (WHERE role_id = v_role_id) = 1
  INTO v_same_role
  FROM admin_user_roles
  WHERE admin_id = p_admin_id;

  v_before_status := v_admin.status::TEXT;

  v_before_active_super := v_admin.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM admin_user_roles AS admin_role
      JOIN roles AS role ON role.id = admin_role.role_id
      WHERE admin_role.admin_id = p_admin_id
        AND role.name = 'super_admin'
    );
  v_after_active_super := p_status = 'active' AND p_role = 'super_admin';

  IF v_before_active_super
    AND NOT v_after_active_super
    AND _active_super_admin_count(p_admin_id) < 1
  THEN
    RAISE EXCEPTION 'At least one active Super Admin must remain'
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_before_active_super
    AND v_after_active_super
    AND _active_super_admin_count(p_admin_id) >= 2
  THEN
    RAISE EXCEPTION 'A maximum of two active Super Admins is allowed'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_admin.status::TEXT = p_status AND v_same_role THEN
    RETURN jsonb_build_object('adminId', v_admin.id, 'changed', FALSE);
  END IF;

  DELETE FROM admin_user_roles
  WHERE admin_id = p_admin_id;

  INSERT INTO admin_user_roles (
    admin_id,
    role_id,
    assigned_by_admin_id
  ) VALUES (
    p_admin_id,
    v_role_id,
    p_actor_admin_id
  );

  UPDATE admin_users
  SET status = p_status::admin_status,
      updated_at = NOW()
  WHERE id = p_admin_id
  RETURNING * INTO v_admin;

  UPDATE auth_sessions
  SET revoked_at = NOW()
  WHERE admin_id = p_admin_id
    AND revoked_at IS NULL;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'admin.role_status_updated',
    'admin',
    v_admin.id::TEXT,
    'Admin role or status updated',
    'warning',
    jsonb_build_object(
      'roles', v_before_roles,
      'status', v_before_status
    ),
    jsonb_build_object(
      'role', p_role,
      'status', p_status
    ),
    p_ip,
    p_device
  );

  RETURN jsonb_build_object('adminId', v_admin.id, 'changed', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_user_code(
  p_admin_id UUID,
  p_code TEXT,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_issued_at TIMESTAMPTZ := NOW();
BEGIN
  PERFORM _assert_admin_user_manager(p_actor_admin_id);

  IF COALESCE(p_code, '') !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'Admin code must contain exactly four digits'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_admin
  FROM admin_users
  WHERE id = p_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_admin.status <> 'active' THEN
    RAISE EXCEPTION 'Activate this admin before resetting the login code'
      USING ERRCODE = '22023';
  END IF;

  UPDATE admin_users
  SET pin_hash = extensions.crypt(p_code, extensions.gen_salt('bf', 12)),
      updated_at = v_issued_at
  WHERE id = p_admin_id;

  UPDATE auth_sessions
  SET revoked_at = v_issued_at
  WHERE admin_id = p_admin_id
    AND revoked_at IS NULL;

  DELETE FROM auth_login_attempts
  WHERE actor_type = 'admin'
    AND phone = v_admin.phone;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'admin.code_reset',
    'admin',
    v_admin.id::TEXT,
    'Admin login code reset',
    'warning',
    NULL,
    jsonb_build_object('codeResetAt', v_issued_at),
    p_ip,
    p_device
  );

  RETURN jsonb_build_object(
    'adminId', v_admin.id,
    'issuedAt', v_issued_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_soft_deactivate_user(
  p_admin_id UUID,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_admin admin_users%ROWTYPE;
  v_is_active_super BOOLEAN;
BEGIN
  PERFORM _assert_admin_user_manager(p_actor_admin_id);
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-user-management', 0));

  SELECT *
  INTO v_admin
  FROM admin_users
  WHERE id = p_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin not found' USING ERRCODE = 'P0002';
  END IF;
  IF p_admin_id = p_actor_admin_id THEN
    RAISE EXCEPTION 'You cannot deactivate your own admin account'
      USING ERRCODE = 'P0001';
  END IF;

  v_is_active_super := v_admin.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM admin_user_roles AS admin_role
      JOIN roles AS role ON role.id = admin_role.role_id
      WHERE admin_role.admin_id = p_admin_id
        AND role.name = 'super_admin'
    );

  IF v_is_active_super AND _active_super_admin_count(p_admin_id) < 1 THEN
    RAISE EXCEPTION 'At least one active Super Admin must remain'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_admin.status = 'inactive' THEN
    UPDATE auth_sessions
    SET revoked_at = NOW()
    WHERE admin_id = p_admin_id
      AND revoked_at IS NULL;
    RETURN jsonb_build_object('adminId', v_admin.id, 'changed', FALSE);
  END IF;

  UPDATE admin_users
  SET status = 'inactive',
      updated_at = NOW()
  WHERE id = p_admin_id;

  UPDATE auth_sessions
  SET revoked_at = NOW()
  WHERE admin_id = p_admin_id
    AND revoked_at IS NULL;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'admin.soft_deactivated',
    'admin',
    v_admin.id::TEXT,
    'Admin access deactivated',
    'warning',
    jsonb_build_object('status', v_admin.status),
    jsonb_build_object('status', 'inactive'),
    p_ip,
    p_device
  );

  RETURN jsonb_build_object('adminId', v_admin.id, 'changed', TRUE);
END;
$$;

REVOKE EXECUTE ON FUNCTION _assert_admin_user_manager(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION _active_super_admin_count(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_promote_member(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_user_role_status(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_reset_user_code(UUID, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_soft_deactivate_user(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION _assert_admin_user_manager(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION _active_super_admin_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION admin_promote_member(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_user_role_status(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_reset_user_code(UUID, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_soft_deactivate_user(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
