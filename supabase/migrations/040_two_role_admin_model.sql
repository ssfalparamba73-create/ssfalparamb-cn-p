-- Collapse admin access to two roles:
-- - admin: all operational access
-- - super_admin: operational access plus admin management and audit deletion

ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'admin';

INSERT INTO permissions (code, description)
VALUES ('audit.delete', 'Delete old audit logs')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO roles (name, description, is_system)
VALUES ('admin', 'Full operational access without admin management or audit deletion', true)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    is_system = true;

DO $$
DECLARE
  v_admin_role_id UUID;
  v_super_role_id UUID;
  v_owner_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO v_super_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO v_owner_admin_id
  FROM admin_users
  WHERE phone = '6282911853'
    AND status = 'active';

  IF v_admin_role_id IS NULL OR v_super_role_id IS NULL THEN
    RAISE EXCEPTION 'Required admin roles are missing';
  END IF;
  IF v_owner_admin_id IS NULL THEN
    RAISE EXCEPTION 'The designated Super Admin 6282911853 is missing or inactive';
  END IF;

  DELETE FROM admin_user_roles;

  INSERT INTO admin_user_roles (admin_id, role_id, assigned_by_admin_id)
  SELECT
    admin_user.id,
    CASE
      WHEN admin_user.id = v_owner_admin_id THEN v_super_role_id
      ELSE v_admin_role_id
    END,
    v_owner_admin_id
  FROM admin_users AS admin_user;
END;
$$;

DELETE FROM roles
WHERE name IN ('president', 'secretary', 'treasurer', 'collector', 'viewer', 'custom');

DELETE FROM role_permissions AS assignment
USING roles AS role
WHERE assignment.role_id = role.id
  AND role.name IN ('admin', 'super_admin');

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
CROSS JOIN permissions AS permission
WHERE role.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
CROSS JOIN permissions AS permission
WHERE role.name = 'admin'
  AND permission.code NOT IN ('admin_users.manage', 'audit.delete')
ON CONFLICT DO NOTHING;

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
    AND name IN ('super_admin', 'admin');

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

  INSERT INTO admin_users (member_id, phone, name, pin_hash, status)
  VALUES (
    v_member.id,
    v_member.phone,
    v_member.name,
    extensions.crypt(p_code, extensions.gen_salt('bf', 12)),
    p_status::admin_status
  )
  RETURNING * INTO v_admin;

  INSERT INTO admin_user_roles (admin_id, role_id, assigned_by_admin_id)
  VALUES (v_admin.id, v_role_id, p_actor_admin_id);

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

  RETURN jsonb_build_object('adminId', v_admin.id, 'issuedAt', v_issued_at);
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
    AND name IN ('super_admin', 'admin');

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

  SELECT COUNT(*) = 1 AND COUNT(*) FILTER (WHERE role_id = v_role_id) = 1
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

  DELETE FROM admin_user_roles WHERE admin_id = p_admin_id;
  INSERT INTO admin_user_roles (admin_id, role_id, assigned_by_admin_id)
  VALUES (p_admin_id, v_role_id, p_actor_admin_id);

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
    jsonb_build_object('roles', v_before_roles, 'status', v_before_status),
    jsonb_build_object('role', p_role, 'status', p_status),
    p_ip,
    p_device
  );

  RETURN jsonb_build_object('adminId', v_admin.id, 'changed', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_user(
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
  v_roles JSONB;
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
    RAISE EXCEPTION 'You cannot delete your own admin account'
      USING ERRCODE = 'P0001';
  END IF;
  IF v_admin.status <> 'inactive' THEN
    RAISE EXCEPTION 'Deactivate this admin before permanent deletion'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(jsonb_agg(role.name ORDER BY role.name), '[]'::JSONB)
  INTO v_roles
  FROM admin_user_roles AS admin_role
  JOIN roles AS role ON role.id = admin_role.role_id
  WHERE admin_role.admin_id = p_admin_id;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'admin.permanently_deleted',
    'admin',
    v_admin.id::TEXT,
    'Inactive admin account permanently deleted',
    'warning',
    jsonb_build_object(
      'name', v_admin.name,
      'phone', v_admin.phone,
      'status', v_admin.status,
      'roles', v_roles
    ),
    jsonb_build_object('deleted', TRUE),
    p_ip,
    p_device
  );

  DELETE FROM admin_users WHERE id = p_admin_id;
  RETURN jsonb_build_object('adminId', p_admin_id, 'deleted', TRUE);
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_promote_member(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_user_role_status(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_delete_user(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION admin_promote_member(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_user_role_status(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
