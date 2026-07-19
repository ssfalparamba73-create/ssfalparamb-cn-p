-- Phase 7: Phone + Generated Code Authentication

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token_hash TEXT UNIQUE NOT NULL,
  actor_type TEXT CHECK (actor_type IN ('member','admin')) NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip INET,
  device TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_auth_sessions_actor_id CHECK (
    (actor_type = 'member' AND member_id IS NOT NULL AND admin_id IS NULL) OR
    (actor_type = 'admin' AND admin_id IS NOT NULL AND member_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_member_id ON auth_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_admin_id ON auth_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT CHECK (actor_type IN ('member','admin')) NOT NULL,
  phone TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (actor_type, phone)
);
-- Deny direct client access
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies means default deny for PUBLIC/authenticated/anon.
-- Only service_role can access these tables.

-- Security Definer RPCs

-- 1. Helper to record attempt
CREATE OR REPLACE FUNCTION _record_login_attempt(p_actor_type text, p_phone text, p_success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_success THEN
    UPDATE auth_login_attempts
    SET failed_count = 0, locked_until = NULL, updated_at = now()
    WHERE actor_type = p_actor_type AND phone = p_phone;
  ELSE
    INSERT INTO auth_login_attempts (actor_type, phone, failed_count, last_failed_at)
    VALUES (p_actor_type, p_phone, 1, now())
    ON CONFLICT (actor_type, phone)
    DO UPDATE SET
      failed_count = auth_login_attempts.failed_count + 1,
      last_failed_at = now(),
      locked_until = CASE
        WHEN auth_login_attempts.failed_count + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE NULL
      END,
      updated_at = now();
  END IF;
END;
$$;
-- 2. Verify Member Login
CREATE OR REPLACE FUNCTION verify_member_login(p_phone text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
-- 3. Verify Admin Login
CREATE OR REPLACE FUNCTION verify_admin_login(p_phone text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
-- Revoke executes
REVOKE EXECUTE ON FUNCTION _record_login_attempt(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_member_login(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_admin_login(text, text) FROM PUBLIC, anon, authenticated;
-- Grant to service_role
GRANT EXECUTE ON FUNCTION _record_login_attempt(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION verify_member_login(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION verify_admin_login(text, text) TO service_role;
