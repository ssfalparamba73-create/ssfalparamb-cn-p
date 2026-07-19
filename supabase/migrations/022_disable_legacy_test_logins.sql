-- Forward-only compatibility and cleanup for Phase 7 authentication.
-- Exact phone matching plus test names prevents changes to real unit accounts.

CREATE OR REPLACE FUNCTION verify_app_login(
  p_actor_type TEXT,
  p_phone TEXT,
  p_code TEXT
)
RETURNS TABLE (
  outcome TEXT,
  actor_id UUID,
  actor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_attempt auth_login_attempts%ROWTYPE;
  v_actor_id UUID;
  v_actor_name TEXT;
  v_pin_hash TEXT;
  v_status TEXT;
  v_pin_status TEXT;
BEGIN
  IF p_actor_type NOT IN ('member', 'admin') THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  SELECT *
  INTO v_attempt
  FROM auth_login_attempts
  WHERE actor_type = p_actor_type
    AND phone = p_phone;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > NOW() THEN
    RETURN QUERY SELECT 'locked'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF p_actor_type = 'member' THEN
    SELECT id, name, pin_hash, status::TEXT, pin_status::TEXT
    INTO v_actor_id, v_actor_name, v_pin_hash, v_status, v_pin_status
    FROM members
    WHERE phone = p_phone;

    IF v_actor_id IS NULL
      OR v_status <> 'active'
      OR v_pin_status <> 'issued'
      OR v_pin_hash IS NULL
      OR crypt(p_code, v_pin_hash) <> v_pin_hash
    THEN
      PERFORM _record_login_attempt(p_actor_type, p_phone, FALSE);
      RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  ELSE
    SELECT id, name, pin_hash, status::TEXT
    INTO v_actor_id, v_actor_name, v_pin_hash, v_status
    FROM admin_users
    WHERE phone = p_phone;

    IF v_actor_id IS NULL
      OR v_status <> 'active'
      OR v_pin_hash IS NULL
      OR crypt(p_code, v_pin_hash) <> v_pin_hash
    THEN
      PERFORM _record_login_attempt(p_actor_type, p_phone, FALSE);
      RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  PERFORM _record_login_attempt(p_actor_type, p_phone, TRUE);
  RETURN QUERY SELECT 'success'::TEXT, v_actor_id, v_actor_name;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_app_login(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_app_login(TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION verify_member_login(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_member_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO service_role;

DELETE FROM auth_sessions
WHERE member_id IN (
  SELECT id FROM members WHERE phone = '8888888888' AND name = 'Test Member'
)
OR admin_id IN (
  SELECT id FROM admin_users WHERE phone = '9999999999' AND name = 'Test Admin'
);

DELETE FROM auth_login_attempts
WHERE (actor_type = 'member' AND phone = '8888888888')
   OR (actor_type = 'admin' AND phone = '9999999999');

UPDATE members
SET status = 'left',
    pin_status = 'reset_required',
    pin_hash = NULL,
    updated_at = NOW()
WHERE phone = '8888888888'
  AND name = 'Test Member';

UPDATE admin_users
SET status = 'inactive',
    pin_hash = NULL,
    updated_at = NOW()
WHERE phone = '9999999999'
  AND name = 'Test Admin';
