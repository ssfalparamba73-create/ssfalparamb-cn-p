-- Keep last_seen semantics fail-closed: only touch a session after the linked
-- actor has passed the same active-account checks used for session resolution.

CREATE OR REPLACE FUNCTION resolve_app_session_context(p_session_token_hash TEXT)
RETURNS TABLE (
  actor_type TEXT,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  permissions TEXT[],
  profile_complete BOOLEAN,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_session auth_sessions%ROWTYPE;
BEGIN
  IF p_session_token_hash IS NULL OR length(p_session_token_hash) <> 64 THEN
    RETURN;
  END IF;

  SELECT sessions.*
  INTO v_session
  FROM auth_sessions AS sessions
  WHERE sessions.session_token_hash = p_session_token_hash
    AND sessions.revoked_at IS NULL
    AND sessions.expires_at > NOW();

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_session.actor_type = 'member' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM members AS member
      WHERE member.id = v_session.member_id
        AND member.status = 'active'
        AND member.pin_status = 'issued'
    ) THEN
      RETURN;
    END IF;

    UPDATE auth_sessions AS sessions
    SET last_seen_at = NOW()
    WHERE sessions.id = v_session.id
      AND sessions.last_seen_at < NOW() - INTERVAL '10 minutes';

    RETURN QUERY
    SELECT
      'member'::TEXT,
      member.id,
      member.name,
      NULL::TEXT,
      ARRAY[]::TEXT[],
      member.profile_completed_at IS NOT NULL,
      v_session.expires_at
    FROM members AS member
    WHERE member.id = v_session.member_id;
    RETURN;
  END IF;

  IF v_session.actor_type = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM admin_users AS admin_user
      WHERE admin_user.id = v_session.admin_id
        AND admin_user.status = 'active'
    ) THEN
      RETURN;
    END IF;

    UPDATE auth_sessions AS sessions
    SET last_seen_at = NOW()
    WHERE sessions.id = v_session.id
      AND sessions.last_seen_at < NOW() - INTERVAL '10 minutes';

    RETURN QUERY
    SELECT
      'admin'::TEXT,
      admin_user.id,
      admin_user.name,
      COALESCE(
        (
          SELECT role.name
          FROM admin_user_roles AS admin_role
          JOIN roles AS role ON role.id = admin_role.role_id
          WHERE admin_role.admin_id = admin_user.id
          ORDER BY
            CASE role.name
              WHEN 'super_admin' THEN 1
              WHEN 'president' THEN 2
              WHEN 'secretary' THEN 3
              WHEN 'treasurer' THEN 4
              WHEN 'collector' THEN 5
              WHEN 'viewer' THEN 6
              ELSE 7
            END,
            role.name
          LIMIT 1
        ),
        'Admin'
      ),
      COALESCE(
        (
          SELECT array_agg(DISTINCT permission.code ORDER BY permission.code)
          FROM admin_user_roles AS admin_role
          JOIN role_permissions AS role_permission ON role_permission.role_id = admin_role.role_id
          JOIN permissions AS permission ON permission.id = role_permission.permission_id
          WHERE admin_role.admin_id = admin_user.id
        ),
        ARRAY[]::TEXT[]
      ),
      NULL::BOOLEAN,
      v_session.expires_at
    FROM admin_users AS admin_user
    WHERE admin_user.id = v_session.admin_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION resolve_app_session_context(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION resolve_app_session_context(TEXT) TO service_role;
