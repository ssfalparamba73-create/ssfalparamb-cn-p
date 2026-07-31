-- Forward-only reconciliation for deployments where configurable Blocks were not applied.
-- The persisted key remains `areas` for API and database compatibility; UI terminology is Block.

INSERT INTO app_settings (namespace, key, value, description, is_public)
VALUES (
  'unit',
  'areas',
  '["Alparamba Center", "North Gate", "South Block"]'::JSONB,
  'Ordered Block options used by member forms and filters',
  TRUE
)
ON CONFLICT (namespace, key) DO UPDATE SET
  description = EXCLUDED.description,
  is_public = TRUE;

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
    'name', 'branch_sector', 'areas', 'official_email', 'address', 'city_district', 'pin_code'
  ];
BEGIN
  PERFORM _assert_settings_manager(p_actor_admin_id);

  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid unit settings input' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_input) AS input_key
    WHERE NOT (input_key = ANY(v_allowed_keys))
  ) THEN
    RAISE EXCEPTION 'Unknown unit setting key' USING ERRCODE = '22023';
  END IF;

  IF p_input ? 'areas' AND (
    jsonb_typeof(p_input->'areas') <> 'array'
    OR jsonb_array_length(p_input->'areas') < 1
    OR jsonb_array_length(p_input->'areas') > 50
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_input->'areas') AS item
      WHERE jsonb_typeof(item) <> 'string'
        OR length(btrim(item #>> '{}')) < 1
        OR length(btrim(item #>> '{}')) > 80
    )
    OR (
      SELECT COUNT(*) FROM jsonb_array_elements_text(p_input->'areas')
    ) <> (
      SELECT COUNT(DISTINCT lower(btrim(value))) FROM jsonb_array_elements_text(p_input->'areas')
    )
  ) THEN
    RAISE EXCEPTION 'Invalid Blocks configuration' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::JSONB)
  INTO v_before FROM app_settings
  WHERE namespace = 'unit' AND key = ANY(v_allowed_keys);

  INSERT INTO app_settings (namespace, key, value, is_public, updated_by_admin_id, updated_at)
  SELECT 'unit', setting.key, setting.value, TRUE, p_actor_admin_id, NOW()
  FROM jsonb_each(p_input) AS setting
  WHERE setting.key = ANY(v_allowed_keys)
  ON CONFLICT (namespace, key) DO UPDATE SET
    value = EXCLUDED.value,
    is_public = TRUE,
    updated_by_admin_id = EXCLUDED.updated_by_admin_id,
    updated_at = NOW();

  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::JSONB)
  INTO v_after FROM app_settings
  WHERE namespace = 'unit' AND key = ANY(v_allowed_keys);

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'settings.unit_updated', 'settings', 'unit', 'Unit settings updated', 'info',
    v_before, v_after, p_ip, p_device
  );

  RETURN v_after;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_unit_settings(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_unit_settings(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;