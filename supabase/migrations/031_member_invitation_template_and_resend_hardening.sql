-- Phase 11A: member invitation template persistence and resend hardening.
-- Forward-only and additive. Rollback is an app rollback; keep the setting and
-- audit history so an older deployment can safely ignore them.

INSERT INTO app_settings (namespace, key, value, description, is_public)
VALUES (
  'member_invitation',
  'whatsapp_template',
  to_jsonb('SSF Alparamba member login: Phone {phone}, PIN {pin}'::TEXT),
  'WhatsApp message template used when issuing a member login PIN.',
  FALSE
)
ON CONFLICT (namespace, key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_audit_member_pin_rate_limit
ON audit_logs (entity_id, created_at DESC)
WHERE entity_type = 'member'::audit_entity_type
  AND action IN ('member.pin_issued', 'member.pin_reset');

CREATE OR REPLACE FUNCTION admin_update_member_invitation_template(
  p_template TEXT,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS TABLE (template TEXT, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_before TEXT;
  v_after TEXT;
  v_updated_at TIMESTAMPTZ;
  v_without_placeholders TEXT;
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
      AND (roles.name = 'super_admin' OR permissions.code = 'settings.update')
  ) THEN
    RAISE EXCEPTION 'Settings update permission required' USING ERRCODE = '42501';
  END IF;

  IF p_template IS NULL OR btrim(p_template) = '' OR char_length(p_template) > 1000 THEN
    RAISE EXCEPTION 'Invalid invitation template' USING ERRCODE = '22023';
  END IF;
  IF strpos(p_template, '{phone}') = 0 OR strpos(p_template, '{pin}') = 0 THEN
    RAISE EXCEPTION 'Invitation template must contain phone and PIN placeholders' USING ERRCODE = '22023';
  END IF;

  v_without_placeholders := replace(
    replace(
      replace(p_template, '{name}', ''),
      '{phone}',
      ''
    ),
    '{pin}',
    ''
  );
  IF v_without_placeholders ~ '[{}]' THEN
    RAISE EXCEPTION 'Invitation template contains an unsupported placeholder' USING ERRCODE = '22023';
  END IF;

  SELECT value #>> '{}'
  INTO v_before
  FROM app_settings
  WHERE namespace = 'member_invitation'
    AND key = 'whatsapp_template'
  FOR UPDATE;

  INSERT INTO app_settings (namespace, key, value, description, is_public, updated_at)
  VALUES (
    'member_invitation',
    'whatsapp_template',
    to_jsonb(p_template),
    'WhatsApp message template used when issuing a member login PIN.',
    FALSE,
    NOW()
  )
  ON CONFLICT (namespace, key)
  DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_public = FALSE,
    updated_at = NOW()
  RETURNING value #>> '{}', app_settings.updated_at
  INTO v_after, v_updated_at;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'settings.member_invitation_updated',
    'settings',
    'member_invitation.whatsapp_template',
    'Member invitation WhatsApp template updated',
    'info',
    jsonb_build_object('template', v_before),
    jsonb_build_object('template', v_after),
    p_ip,
    p_device
  );

  RETURN QUERY SELECT v_after, v_updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION admin_issue_member_pin(
  p_member_id UUID,
  p_pin TEXT,
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

REVOKE EXECUTE ON FUNCTION admin_update_member_invitation_template(TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_issue_member_pin(UUID, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_member_invitation_template(TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_issue_member_pin(UUID, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
