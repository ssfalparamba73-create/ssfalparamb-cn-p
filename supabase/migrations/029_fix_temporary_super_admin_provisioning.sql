-- Fix the temporary bootstrap helper's output-column name collision. The failed
-- invocation was transactional and did not create or modify an admin account.

DROP FUNCTION IF EXISTS provision_unit_super_admin(TEXT, TEXT, TEXT);

CREATE FUNCTION provision_unit_super_admin(
  p_phone TEXT,
  p_pin TEXT,
  p_name TEXT DEFAULT 'Super Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_phone TEXT := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_name TEXT := btrim(COALESCE(p_name, ''));
  v_admin admin_users%ROWTYPE;
  v_role_id UUID;
  v_was_created BOOLEAN := FALSE;
  v_before JSONB;
BEGIN
  IF v_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Phone must contain exactly 10 digits' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_pin, '') !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must contain exactly 4 digits' USING ERRCODE = '22023';
  END IF;
  IF length(v_name) < 2 OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Admin name must contain 2 to 120 characters' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_admin
  FROM admin_users
  WHERE phone = v_phone
  FOR UPDATE;

  IF FOUND THEN
    v_before := jsonb_build_object(
      'name', v_admin.name,
      'phone', v_admin.phone,
      'status', v_admin.status
    );

    UPDATE admin_users
    SET name = v_name,
        status = 'active',
        pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 12)),
        updated_at = NOW()
    WHERE id = v_admin.id
    RETURNING * INTO v_admin;
  ELSE
    INSERT INTO admin_users (phone, name, status, pin_hash)
    VALUES (
      v_phone,
      v_name,
      'active',
      extensions.crypt(p_pin, extensions.gen_salt('bf', 12))
    )
    RETURNING * INTO v_admin;
    v_was_created := TRUE;
  END IF;

  SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role is not configured';
  END IF;

  INSERT INTO admin_user_roles (admin_id, role_id)
  VALUES (v_admin.id, v_role_id)
  ON CONFLICT DO NOTHING;

  UPDATE auth_sessions AS sessions
  SET revoked_at = NOW()
  WHERE sessions.admin_id = v_admin.id
    AND sessions.revoked_at IS NULL;

  DELETE FROM auth_login_attempts AS attempts
  WHERE attempts.actor_type = 'admin'
    AND attempts.phone = v_phone;

  PERFORM record_audit_event(
    NULL,
    'System Bootstrap',
    CASE WHEN v_was_created THEN 'admin.super_admin_created' ELSE 'admin.super_admin_reset' END,
    'admin',
    v_admin.id::TEXT,
    'Unit super admin provisioned',
    'warning',
    v_before,
    jsonb_build_object(
      'name', v_admin.name,
      'phone', v_admin.phone,
      'status', v_admin.status,
      'role', 'super_admin'
    ),
    NULL,
    NULL
  );

  RETURN jsonb_build_object(
    'adminId', v_admin.id,
    'wasCreated', v_was_created
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION provision_unit_super_admin(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION provision_unit_super_admin(TEXT, TEXT, TEXT) TO service_role;
