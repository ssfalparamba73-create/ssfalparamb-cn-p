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
  -- Check attempts
  SELECT * INTO v_attempt FROM auth_login_attempts WHERE actor_type = 'member' AND phone = p_phone;
  
  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOO_MANY_ATTEMPTS');
  END IF;

  -- Find member
  SELECT id, status, pin_hash, name INTO v_member FROM members WHERE phone = p_phone;
  
  IF NOT FOUND THEN
    PERFORM _record_login_attempt('member', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  IF v_member.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_ACCOUNT');
  END IF;

  -- Validate hash
  IF v_member.pin_hash IS NULL OR v_member.pin_hash != crypt(p_pin, v_member.pin_hash) THEN
    PERFORM _record_login_attempt('member', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  -- Success
  PERFORM _record_login_attempt('member', p_phone, true);
  RETURN jsonb_build_object(
    'success', true,
    'id', v_member.id,
    'name', v_member.name
  );
END;
$$;

CREATE OR REPLACE FUNCTION verify_admin_login(p_phone text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_admin record;
  v_attempt record;
BEGIN
  -- Check attempts
  SELECT * INTO v_attempt FROM auth_login_attempts WHERE actor_type = 'admin' AND phone = p_phone;
  
  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOO_MANY_ATTEMPTS');
  END IF;

  -- Find admin
  SELECT id, status, pin_hash, name INTO v_admin FROM admin_users WHERE phone = p_phone;
  
  IF NOT FOUND THEN
    PERFORM _record_login_attempt('admin', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  IF v_admin.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_ACCOUNT');
  END IF;

  -- Validate hash
  IF v_admin.pin_hash IS NULL OR v_admin.pin_hash != crypt(p_code, v_admin.pin_hash) THEN
    PERFORM _record_login_attempt('admin', p_phone, false);
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CREDENTIALS');
  END IF;

  -- Success
  PERFORM _record_login_attempt('admin', p_phone, true);
  RETURN jsonb_build_object(
    'success', true,
    'id', v_admin.id,
    'name', v_admin.name
  );
END;
$$;