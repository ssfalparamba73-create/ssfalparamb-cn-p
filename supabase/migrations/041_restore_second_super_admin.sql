-- Restore the approved second Super Admin while preserving the maximum-of-two rule.

DO $$
DECLARE
  v_target_admin_id UUID;
  v_super_role_id UUID;
  v_owner_admin_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-user-management', 0));

  SELECT id INTO v_owner_admin_id
  FROM admin_users
  WHERE phone = '6282911853'
    AND status = 'active';

  SELECT id INTO v_target_admin_id
  FROM admin_users
  WHERE phone = '9074884847'
    AND status = 'active';

  SELECT id INTO v_super_role_id
  FROM roles
  WHERE name = 'super_admin';

  IF v_owner_admin_id IS NULL OR v_target_admin_id IS NULL OR v_super_role_id IS NULL THEN
    RAISE EXCEPTION 'Approved Super Admin accounts or role are missing';
  END IF;

  IF _active_super_admin_count(v_target_admin_id) >= 2 THEN
    RAISE EXCEPTION 'A maximum of two active Super Admins is allowed';
  END IF;

  DELETE FROM admin_user_roles
  WHERE admin_id = v_target_admin_id;

  INSERT INTO admin_user_roles (admin_id, role_id, assigned_by_admin_id)
  VALUES (v_target_admin_id, v_super_role_id, v_owner_admin_id);

  UPDATE auth_sessions
  SET revoked_at = NOW()
  WHERE admin_id = v_target_admin_id
    AND revoked_at IS NULL;
END;
$$;
