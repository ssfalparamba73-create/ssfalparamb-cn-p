-- Reusable member invitation PIN handoff with encrypted-at-rest storage.
-- The login PIN hash in members remains the authentication source of truth.

CREATE TABLE IF NOT EXISTS member_login_pin_secrets (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  pin_ciphertext BYTEA NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE member_login_pin_secrets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON member_login_pin_secrets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON member_login_pin_secrets TO service_role;

DROP FUNCTION IF EXISTS admin_issue_member_pin(UUID, TEXT, UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION admin_issue_member_pin(
  p_member_id UUID,
  p_pin TEXT,
  p_pin_encryption_key TEXT,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_issued_at TIMESTAMPTZ := NOW();
  v_action TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM admin_users AS admins
    JOIN admin_user_roles AS assignments ON assignments.admin_id = admins.id
    JOIN roles ON roles.id = assignments.role_id
    LEFT JOIN role_permissions AS role_access ON role_access.role_id = roles.id
    LEFT JOIN permissions ON permissions.id = role_access.permission_id
    WHERE admins.id = p_actor_admin_id
      AND admins.status = 'active'
      AND (roles.name = 'super_admin' OR permissions.code = 'members.update')
  ) THEN
    RAISE EXCEPTION 'Member update permission required' USING ERRCODE = '42501';
  END IF;

  IF p_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN must contain exactly four digits' USING ERRCODE = '22023';
  END IF;
  IF p_pin_encryption_key IS NULL OR char_length(p_pin_encryption_key) < 32 THEN
    RAISE EXCEPTION 'PIN encryption key is invalid' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_member FROM members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_member.status <> 'active' THEN
    RAISE EXCEPTION 'A login invitation can only be issued to an active member' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM audit_logs
    WHERE entity_type = 'member'::audit_entity_type
      AND entity_id = p_member_id::TEXT
      AND action IN ('member.pin_issued', 'member.pin_reset')
      AND created_at > v_issued_at - INTERVAL '30 seconds'
  ) OR (
    SELECT COUNT(*)
    FROM audit_logs
    WHERE entity_type = 'member'::audit_entity_type
      AND entity_id = p_member_id::TEXT
      AND action IN ('member.pin_issued', 'member.pin_reset')
      AND created_at > v_issued_at - INTERVAL '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'MEMBER_INVITATION_RATE_LIMITED' USING ERRCODE = 'P0001';
  END IF;

  v_action := CASE WHEN v_member.pin_status = 'issued' THEN 'member.pin_reset' ELSE 'member.pin_issued' END;

  UPDATE members
  SET pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')),
      pin_status = 'issued',
      updated_at = v_issued_at
  WHERE id = p_member_id;

  INSERT INTO member_login_pin_secrets (member_id, pin_ciphertext, issued_at, updated_at)
  VALUES (
    p_member_id,
    extensions.pgp_sym_encrypt(p_pin, p_pin_encryption_key, 'cipher-algo=aes256'),
    v_issued_at,
    v_issued_at
  )
  ON CONFLICT (member_id)
  DO UPDATE SET
    pin_ciphertext = EXCLUDED.pin_ciphertext,
    issued_at = EXCLUDED.issued_at,
    updated_at = EXCLUDED.updated_at;

  UPDATE auth_sessions
  SET revoked_at = v_issued_at
  WHERE member_id = p_member_id
    AND revoked_at IS NULL;

  DELETE FROM auth_login_attempts
  WHERE actor_type = 'member'
    AND phone = v_member.phone;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    v_action,
    'member',
    p_member_id::TEXT,
    CASE WHEN v_action = 'member.pin_reset' THEN 'Member PIN reset' ELSE 'Member PIN issued' END,
    'warning',
    jsonb_build_object('pinStatus', v_member.pin_status),
    jsonb_build_object('pinStatus', 'issued'),
    p_ip,
    p_device
  );

  RETURN v_issued_at;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_member_pin_secret(
  p_member_id UUID,
  p_pin_encryption_key TEXT,
  p_actor_admin_id UUID
)
RETURNS TABLE (pin TEXT, issued_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM admin_users AS admins
    JOIN admin_user_roles AS assignments ON assignments.admin_id = admins.id
    JOIN roles ON roles.id = assignments.role_id
    LEFT JOIN role_permissions AS role_access ON role_access.role_id = roles.id
    LEFT JOIN permissions ON permissions.id = role_access.permission_id
    WHERE admins.id = p_actor_admin_id
      AND admins.status = 'active'
      AND (roles.name = 'super_admin' OR permissions.code = 'members.update')
  ) THEN
    RAISE EXCEPTION 'Member update permission required' USING ERRCODE = '42501';
  END IF;

  IF p_pin_encryption_key IS NULL OR char_length(p_pin_encryption_key) < 32 THEN
    RAISE EXCEPTION 'PIN encryption key is invalid' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    extensions.pgp_sym_decrypt(secrets.pin_ciphertext, p_pin_encryption_key)::TEXT,
    secrets.issued_at
  FROM member_login_pin_secrets AS secrets
  WHERE secrets.member_id = p_member_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_issue_member_pin(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_get_member_pin_secret(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_issue_member_pin(UUID, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_get_member_pin_secret(UUID, TEXT, UUID) TO service_role;
