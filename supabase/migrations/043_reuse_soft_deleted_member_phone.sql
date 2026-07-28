-- Preserve soft-deleted members and their history, but release their phone
-- number so it can be assigned to a current member.
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_phone_non_left
  ON members (phone)
  WHERE status IS DISTINCT FROM 'left';

-- A recycled phone belongs to a new identity, so it must not inherit the old
-- member's failed-attempt counter or temporary lockout.
CREATE OR REPLACE FUNCTION clear_reused_member_phone_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  DELETE FROM auth_login_attempts
  WHERE actor_type = 'member' AND phone = NEW.phone;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_reused_member_phone_login_attempts ON members;
CREATE TRIGGER trg_clear_reused_member_phone_login_attempts
AFTER INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION clear_reused_member_phone_login_attempts();
-- Historical rows must not participate in authentication after phone reuse.
CREATE OR REPLACE FUNCTION verify_member_login(p_phone text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_member record;
  v_attempt record;
BEGIN
  SELECT * INTO v_attempt FROM auth_login_attempts
  WHERE actor_type = 'member' AND phone = p_phone;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOO_MANY_ATTEMPTS');
  END IF;

  SELECT id, status, pin_hash, name INTO v_member FROM members
  WHERE phone = p_phone AND status = 'active';

  IF NOT FOUND THEN
    PERFORM _record_login_attempt('member', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  IF v_member.pin_hash IS NULL OR v_member.pin_hash != crypt(p_pin, v_member.pin_hash) THEN
    PERFORM _record_login_attempt('member', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  PERFORM _record_login_attempt('member', p_phone, true);
  RETURN jsonb_build_object('success', true, 'id', v_member.id, 'name', v_member.name);
END;
$$;

CREATE OR REPLACE FUNCTION verify_app_login(p_actor_type TEXT, p_phone TEXT, p_code TEXT)
RETURNS TABLE (outcome TEXT, actor_id UUID, actor_name TEXT)
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

  SELECT * INTO v_attempt FROM auth_login_attempts
  WHERE actor_type = p_actor_type AND phone = p_phone;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > NOW() THEN
    RETURN QUERY SELECT 'locked'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF p_actor_type = 'member' THEN
    SELECT id, name, pin_hash, status::TEXT, pin_status::TEXT
    INTO v_actor_id, v_actor_name, v_pin_hash, v_status, v_pin_status
    FROM members
    WHERE phone = p_phone AND status = 'active';

    IF v_actor_id IS NULL OR v_pin_status <> 'issued' OR v_pin_hash IS NULL
      OR crypt(p_code, v_pin_hash) <> v_pin_hash THEN
      PERFORM _record_login_attempt(p_actor_type, p_phone, FALSE);
      RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  ELSE
    SELECT id, name, pin_hash, status::TEXT
    INTO v_actor_id, v_actor_name, v_pin_hash, v_status
    FROM admin_users WHERE phone = p_phone;

    IF v_actor_id IS NULL OR v_status <> 'active' OR v_pin_hash IS NULL
      OR crypt(p_code, v_pin_hash) <> v_pin_hash THEN
      PERFORM _record_login_attempt(p_actor_type, p_phone, FALSE);
      RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  PERFORM _record_login_attempt(p_actor_type, p_phone, TRUE);
  RETURN QUERY SELECT 'success'::TEXT, v_actor_id, v_actor_name;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_member_login(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_app_login(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_member_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_app_login(TEXT, TEXT, TEXT) TO service_role;