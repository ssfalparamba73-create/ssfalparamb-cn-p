-- Update the member invitation copy and support a deployment-aware login URL.
-- Forward-only: preserves the editable setting and its existing audit history.

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
      replace(
        replace(p_template, '{name}', ''),
        '{phone}',
        ''
      ),
      '{pin}',
      ''
    ),
    '{loginUrl}',
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

UPDATE app_settings
SET
  value = to_jsonb($template$السلام عليكم ورحمة الله وبركاته

പ്രിയ കൂട്ടുകാരാ...

       ഖിയാമത് നാളിൽ സൂര്യൻ തലക്ക് മീതെ കത്തിജ്വലിക്കുമ്പോൾ *SSF കാർക്ക് അർശിൻ്റ തണലുണ്ട്.* വടകര മുഹമ്മദ് ഹാജി തങ്ങളുടെ വാക്കുകളാണിത്.

തെറ്റുകളിലേക്ക് വഴുതിവീഴാൻ സാധ്യത ഏറെയുള്ള ഈ യൗവ്വനകാലത്ത് ഒരു SSF കാരനാവുക... *എത്ര വലിയ ഭാഗ്യമാണ്!*

നമ്മുടെ യൂണിറ്റ് പുതിയൊരു ചുവടുവെപ്പിലേക്ക് കാലെടുത്തുവെക്കുകയാണ്. അതിന്റെ ആദ്യഘട്ടമായി പ്രവർത്തകരുടെ *വിവരശേഖരണം* ആരംഭിച്ചിരിക്കുന്നു.

അതുകൊണ്ട്, താഴെ നൽകിയിരിക്കുന്ന ലിങ്കിൽ പ്രവേശിച്ച് നിങ്ങളുടെ വിവരങ്ങൾ കൃത്യമായി പൂരിപ്പിച്ച് അപ്ഡേറ്റ് ചെയ്യണമെന്ന് സ്നേഹപൂർവ്വം അഭ്യർത്ഥിക്കുന്നു.

ലോഗിൻ ലിങ്ക്: {loginUrl}
ഫോൺ നമ്പർ: {phone}
PIN: {pin}

നിങ്ങളുടെ സഹകരണം പ്രതീക്ഷിക്കുന്നു.

*©SSF ALPARAMBA*$template$::TEXT),
  description = 'WhatsApp message template used when issuing a member login PIN.',
  is_public = FALSE,
  updated_at = NOW()
WHERE namespace = 'member_invitation'
  AND key = 'whatsapp_template';

REVOKE EXECUTE ON FUNCTION admin_update_member_invitation_template(TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_member_invitation_template(TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
