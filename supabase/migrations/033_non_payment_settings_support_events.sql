-- Phase 11: non-payment settings, support-contact management, and event configuration.
-- This migration is additive. It does not activate payment collection or mutate payment rows.

ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'support_contact';
ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'event';

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE support_contacts
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

WITH ordered_contacts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 AS next_sort_order
  FROM support_contacts
)
UPDATE support_contacts AS contact
SET sort_order = ordered_contacts.next_sort_order
FROM ordered_contacts
WHERE contact.id = ordered_contacts.id;

ALTER TABLE special_events
  ADD COLUMN IF NOT EXISTS suggested_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS receipt_theme TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_special_events_receipt_theme'
      AND conrelid = 'special_events'::regclass
  ) THEN
    ALTER TABLE special_events
      ADD CONSTRAINT chk_special_events_receipt_theme
      CHECK (receipt_theme IN ('default', 'amber'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_support_contacts_active_order
  ON support_contacts(is_active, sort_order)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_contacts_single_primary
  ON support_contacts(is_primary)
  WHERE is_primary = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_special_events_active
  ON special_events(is_active, created_at DESC)
  WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Public can view active support contacts" ON support_contacts;
CREATE POLICY "Public can view active support contacts"
ON support_contacts
FOR SELECT
USING (is_active = TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can manage support contacts" ON support_contacts;
CREATE POLICY "Admins can manage support contacts"
ON support_contacts
FOR ALL
USING (has_permission('settings.update') OR is_super_admin())
WITH CHECK (has_permission('settings.update') OR is_super_admin());

DROP POLICY IF EXISTS "Public can view active events" ON special_events;
CREATE POLICY "Public can view active events"
ON special_events
FOR SELECT
USING (is_active = TRUE AND deleted_at IS NULL);

CREATE OR REPLACE FUNCTION _assert_settings_manager(p_actor_admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_actor_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM admin_users AS actor
    JOIN admin_user_roles AS actor_role ON actor_role.admin_id = actor.id
    JOIN roles AS role ON role.id = actor_role.role_id
    LEFT JOIN role_permissions AS role_permission ON role_permission.role_id = role.id
    LEFT JOIN permissions AS permission ON permission.id = role_permission.permission_id
    WHERE actor.id = p_actor_admin_id
      AND actor.status = 'active'
      AND (role.name = 'super_admin' OR permission.code = 'settings.update')
  ) THEN
    RAISE EXCEPTION 'Settings update permission is required' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_unit_settings(
  p_input JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before JSONB;
  v_after JSONB;
  v_allowed_keys CONSTANT TEXT[] := ARRAY[
    'name',
    'branch_sector',
    'official_email',
    'address',
    'city_district',
    'pin_code'
  ];
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid unit settings input' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_object_keys(p_input) AS input_key
    WHERE NOT (input_key = ANY(v_allowed_keys))
  ) THEN
    RAISE EXCEPTION 'Unknown unit setting key' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::JSONB)
  INTO v_before
  FROM app_settings
  WHERE namespace = 'unit'
    AND key = ANY(v_allowed_keys);

  INSERT INTO app_settings (
    namespace,
    key,
    value,
    is_public,
    updated_by_admin_id,
    updated_at
  )
  SELECT
    'unit',
    setting.key,
    setting.value,
    TRUE,
    p_actor_admin_id,
    NOW()
  FROM jsonb_each(p_input) AS setting
  WHERE setting.key = ANY(v_allowed_keys)
  ON CONFLICT (namespace, key)
  DO UPDATE SET
    value = EXCLUDED.value,
    is_public = TRUE,
    updated_by_admin_id = EXCLUDED.updated_by_admin_id,
    updated_at = NOW();

  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::JSONB)
  INTO v_after
  FROM app_settings
  WHERE namespace = 'unit'
    AND key = ANY(v_allowed_keys);

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'settings.unit_updated',
    'settings',
    'unit',
    'Unit settings updated',
    'info',
    v_before,
    v_after,
    p_ip,
    p_device
  );

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_support_contact(
  p_input JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF support_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contact support_contacts%ROWTYPE;
  v_sort_order INTEGER;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid support contact input' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(sort_order), -1) + 1
  INTO v_sort_order
  FROM support_contacts
  WHERE deleted_at IS NULL;

  IF COALESCE((p_input->>'isPrimary')::BOOLEAN, FALSE) THEN
    UPDATE support_contacts
    SET is_primary = FALSE, updated_at = NOW()
    WHERE is_primary = TRUE AND deleted_at IS NULL;
  END IF;

  INSERT INTO support_contacts (
    name,
    role,
    phone,
    email,
    whatsapp_enabled,
    is_primary,
    sort_order,
    is_active
  ) VALUES (
    p_input->>'name',
    NULLIF(p_input->>'role', ''),
    p_input->>'phone',
    NULLIF(p_input->>'email', ''),
    COALESCE((p_input->>'whatsappEnabled')::BOOLEAN, TRUE),
    COALESCE((p_input->>'isPrimary')::BOOLEAN, FALSE),
    v_sort_order,
    COALESCE((p_input->>'isActive')::BOOLEAN, TRUE)
  )
  RETURNING * INTO v_contact;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'support_contact.created',
    'support_contact',
    v_contact.id::TEXT,
    'Support contact created',
    'info',
    NULL,
    to_jsonb(v_contact),
    p_ip,
    p_device
  );

  RETURN NEXT v_contact;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_support_contact(
  p_contact_id UUID,
  p_input JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF support_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before support_contacts%ROWTYPE;
  v_after support_contacts%ROWTYPE;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid support contact input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_before
  FROM support_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Support contact not found' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE((p_input->>'isPrimary')::BOOLEAN, v_before.is_primary) THEN
    UPDATE support_contacts
    SET is_primary = FALSE, updated_at = NOW()
    WHERE id <> p_contact_id AND is_primary = TRUE AND deleted_at IS NULL;
  END IF;

  UPDATE support_contacts
  SET
    name = CASE WHEN p_input ? 'name' THEN p_input->>'name' ELSE name END,
    role = CASE WHEN p_input ? 'role' THEN NULLIF(p_input->>'role', '') ELSE role END,
    phone = CASE WHEN p_input ? 'phone' THEN p_input->>'phone' ELSE phone END,
    email = CASE WHEN p_input ? 'email' THEN NULLIF(p_input->>'email', '') ELSE email END,
    whatsapp_enabled = CASE WHEN p_input ? 'whatsappEnabled' THEN (p_input->>'whatsappEnabled')::BOOLEAN ELSE whatsapp_enabled END,
    is_primary = CASE WHEN p_input ? 'isPrimary' THEN (p_input->>'isPrimary')::BOOLEAN ELSE is_primary END,
    is_active = CASE WHEN p_input ? 'isActive' THEN (p_input->>'isActive')::BOOLEAN ELSE is_active END,
    updated_at = NOW()
  WHERE id = p_contact_id
  RETURNING * INTO v_after;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'support_contact.updated',
    'support_contact',
    v_after.id::TEXT,
    'Support contact updated',
    'info',
    to_jsonb(v_before),
    to_jsonb(v_after),
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

CREATE OR REPLACE FUNCTION admin_archive_support_contact(
  p_contact_id UUID,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before support_contacts%ROWTYPE;
  v_after support_contacts%ROWTYPE;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  SELECT * INTO v_before
  FROM support_contacts
  WHERE id = p_contact_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Support contact not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE support_contacts
  SET
    is_active = FALSE,
    is_primary = FALSE,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_contact_id
  RETURNING * INTO v_after;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'support_contact.archived',
    'support_contact',
    v_after.id::TEXT,
    'Support contact archived',
    'warning',
    to_jsonb(v_before),
    to_jsonb(v_after),
    p_ip,
    p_device
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_reorder_support_contacts(
  p_contact_ids JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_live_count INTEGER;
  v_distinct_count INTEGER;
  v_before JSONB;
  v_after JSONB;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_contact_ids IS NULL OR jsonb_typeof(p_contact_ids) <> 'array' THEN
    RAISE EXCEPTION 'Invalid support contact order' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO v_live_count
  FROM support_contacts
  WHERE deleted_at IS NULL;

  SELECT COUNT(DISTINCT value) INTO v_distinct_count
  FROM jsonb_array_elements_text(p_contact_ids);

  IF jsonb_array_length(p_contact_ids) <> v_live_count
     OR v_distinct_count <> v_live_count THEN
    RAISE EXCEPTION 'Support contact order must contain every active record exactly once' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(p_contact_ids) AS supplied(id)
    LEFT JOIN support_contacts AS contact
      ON contact.id::TEXT = supplied.id AND contact.deleted_at IS NULL
    WHERE contact.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Support contact order contains an unknown record' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(jsonb_object_agg(id::TEXT, sort_order), '{}'::JSONB)
  INTO v_before
  FROM support_contacts
  WHERE deleted_at IS NULL;

  UPDATE support_contacts AS contact
  SET sort_order = supplied.ordinality - 1, updated_at = NOW()
  FROM jsonb_array_elements_text(p_contact_ids) WITH ORDINALITY AS supplied(id, ordinality)
  WHERE contact.id::TEXT = supplied.id AND contact.deleted_at IS NULL;

  SELECT COALESCE(jsonb_object_agg(id::TEXT, sort_order), '{}'::JSONB)
  INTO v_after
  FROM support_contacts
  WHERE deleted_at IS NULL;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'support_contact.reordered',
    'support_contact',
    'order',
    'Support contacts reordered',
    'info',
    v_before,
    v_after,
    p_ip,
    p_device
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_special_event(
  p_input JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF special_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event special_events%ROWTYPE;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid event input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO special_events (
    name,
    description,
    suggested_amount,
    minimum_amount,
    receipt_theme,
    is_active
  ) VALUES (
    p_input->>'name',
    NULLIF(p_input->>'description', ''),
    NULLIF(p_input->>'suggestedAmount', '')::NUMERIC,
    (p_input->>'minimumAmount')::NUMERIC,
    COALESCE(NULLIF(p_input->>'receiptTheme', ''), 'default'),
    COALESCE((p_input->>'isActive')::BOOLEAN, TRUE)
  )
  RETURNING * INTO v_event;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'event.created',
    'event',
    v_event.id::TEXT,
    'Special event created without payment activation',
    'info',
    NULL,
    to_jsonb(v_event),
    p_ip,
    p_device
  );

  RETURN NEXT v_event;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_special_event(
  p_event_id UUID,
  p_input JSONB,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF special_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before special_events%ROWTYPE;
  v_after special_events%ROWTYPE;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid event input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_before
  FROM special_events
  WHERE id = p_event_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Special event not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE special_events
  SET
    name = CASE WHEN p_input ? 'name' THEN p_input->>'name' ELSE name END,
    description = CASE WHEN p_input ? 'description' THEN NULLIF(p_input->>'description', '') ELSE description END,
    suggested_amount = CASE WHEN p_input ? 'suggestedAmount' THEN NULLIF(p_input->>'suggestedAmount', '')::NUMERIC ELSE suggested_amount END,
    minimum_amount = CASE WHEN p_input ? 'minimumAmount' THEN (p_input->>'minimumAmount')::NUMERIC ELSE minimum_amount END,
    receipt_theme = CASE WHEN p_input ? 'receiptTheme' THEN p_input->>'receiptTheme' ELSE receipt_theme END,
    is_active = CASE WHEN p_input ? 'isActive' THEN (p_input->>'isActive')::BOOLEAN ELSE is_active END,
    updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_after;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'event.updated',
    'event',
    v_after.id::TEXT,
    'Special event configuration updated without payment activation',
    'info',
    to_jsonb(v_before),
    to_jsonb(v_after),
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

CREATE OR REPLACE FUNCTION admin_archive_special_event(
  p_event_id UUID,
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before special_events%ROWTYPE;
  v_after special_events%ROWTYPE;
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  SELECT * INTO v_before
  FROM special_events
  WHERE id = p_event_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Special event not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE special_events
  SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_after;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'event.archived',
    'event',
    v_after.id::TEXT,
    'Special event archived without changing payment records',
    'warning',
    to_jsonb(v_before),
    to_jsonb(v_after),
    p_ip,
    p_device
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION _assert_settings_manager(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_unit_settings(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_create_support_contact(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_support_contact(UUID, JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_archive_support_contact(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_reorder_support_contacts(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_create_special_event(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_special_event(UUID, JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_archive_special_event(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION _assert_settings_manager(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_unit_settings(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_create_support_contact(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_support_contact(UUID, JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_archive_support_contact(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_reorder_support_contacts(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_create_special_event(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_special_event(UUID, JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_archive_special_event(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- Rollback notes:
-- Drop the eight admin_* functions and the additive indexes/columns only after
-- all application reads have been moved back. Never remove archived data as part
-- of rollback. Restore the previous public policies if the app is rolled back.
