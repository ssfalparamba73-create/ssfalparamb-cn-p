-- First-login member profile completion gate.
-- Existing genuinely complete profiles are backfilled; name and phone remain the
-- admin-established identity fields during onboarding.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

UPDATE members
SET profile_completed_at = COALESCE(updated_at, NOW())
WHERE profile_completed_at IS NULL
  AND age IS NOT NULL
  AND blood_group IS NOT NULL
  AND NULLIF(btrim(COALESCE(whatsapp, '')), '') IS NOT NULL
  AND NULLIF(btrim(COALESCE(address, '')), '') IS NOT NULL
  AND NULLIF(btrim(COALESCE(occupation, '')), '') IS NOT NULL;

CREATE OR REPLACE FUNCTION member_complete_profile(
  p_member_id UUID,
  p_input JSONB,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_before members%ROWTYPE;
  v_after members%ROWTYPE;
  v_whatsapp TEXT;
  v_address TEXT;
  v_occupation TEXT;
  v_age INTEGER;
  v_blood_group blood_group;
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile completion input' USING ERRCODE = '22023';
  END IF;

  v_whatsapp := NULLIF(btrim(COALESCE(p_input->>'whatsapp', '')), '');
  v_address := NULLIF(btrim(COALESCE(p_input->>'address', '')), '');
  v_occupation := NULLIF(btrim(COALESCE(p_input->>'occupation', '')), '');

  IF v_whatsapp IS NULL OR v_whatsapp !~ '^\d{7,15}$' THEN
    RAISE EXCEPTION 'A valid WhatsApp number is required' USING ERRCODE = '22023';
  END IF;
  IF NOT (p_input ? 'age') THEN
    RAISE EXCEPTION 'Age is required' USING ERRCODE = '22023';
  END IF;
  v_age := (p_input->>'age')::INTEGER;
  IF v_age < 0 OR v_age > 130 THEN
    RAISE EXCEPTION 'Age is invalid' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(p_input->>'bloodGroup', '') IS NULL THEN
    RAISE EXCEPTION 'Blood group is required' USING ERRCODE = '22023';
  END IF;
  v_blood_group := (p_input->>'bloodGroup')::blood_group;
  IF v_address IS NULL OR char_length(v_address) > 500 THEN
    RAISE EXCEPTION 'Address is required and must be 500 characters or fewer' USING ERRCODE = '22023';
  END IF;
  IF v_occupation IS NULL OR char_length(v_occupation) > 120 THEN
    RAISE EXCEPTION 'Occupation is required and must be 120 characters or fewer' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_before
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.status <> 'active' THEN
    RAISE EXCEPTION 'Only active members can complete their profile' USING ERRCODE = '22023';
  END IF;

  UPDATE members
  SET whatsapp = v_whatsapp,
      age = v_age,
      blood_group = v_blood_group,
      address = v_address,
      occupation = v_occupation,
      profile_completed_at = COALESCE(profile_completed_at, NOW()),
      updated_at = NOW()
  WHERE id = p_member_id
  RETURNING * INTO v_after;

  PERFORM record_audit_event(
    NULL,
    COALESCE(NULLIF(p_actor_name, ''), v_after.name),
    'member.profile_completed',
    'member',
    p_member_id::TEXT,
    'Member completed first-login profile',
    'info',
    jsonb_build_object('profileComplete', v_before.profile_completed_at IS NOT NULL),
    jsonb_build_object('profileComplete', TRUE),
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

CREATE OR REPLACE FUNCTION member_update_profile(
  p_member_id UUID,
  p_input JSONB,
  p_actor_name TEXT,
  p_ip TEXT,
  p_device TEXT
)
RETURNS SETOF members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_before members%ROWTYPE;
  v_after members%ROWTYPE;
  v_before_safe JSONB;
  v_after_safe JSONB;
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_before
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.status <> 'active' THEN
    RAISE EXCEPTION 'Only active members can update their profile' USING ERRCODE = '22023';
  END IF;

  UPDATE members
  SET
    name = CASE WHEN p_input ? 'name' THEN p_input->>'name' ELSE name END,
    whatsapp = CASE WHEN p_input ? 'whatsapp' THEN NULLIF(p_input->>'whatsapp', '') ELSE whatsapp END,
    age = CASE WHEN p_input ? 'age' THEN NULLIF(p_input->>'age', '')::INTEGER ELSE age END,
    blood_group = CASE WHEN p_input ? 'bloodGroup' THEN NULLIF(p_input->>'bloodGroup', '')::blood_group ELSE blood_group END,
    address = CASE WHEN p_input ? 'address' THEN NULLIF(p_input->>'address', '') ELSE address END,
    occupation = CASE WHEN p_input ? 'occupation' THEN NULLIF(p_input->>'occupation', '') ELSE occupation END,
    biometric_enabled = CASE WHEN p_input ? 'biometricEnabled' THEN COALESCE((p_input->>'biometricEnabled')::BOOLEAN, FALSE) ELSE biometric_enabled END,
    updated_at = NOW()
  WHERE id = p_member_id
  RETURNING * INTO v_after;

  IF v_before.profile_completed_at IS NOT NULL AND (
    v_after.age IS NULL OR
    v_after.blood_group IS NULL OR
    NULLIF(btrim(COALESCE(v_after.whatsapp, '')), '') IS NULL OR
    NULLIF(btrim(COALESCE(v_after.address, '')), '') IS NULL OR
    NULLIF(btrim(COALESCE(v_after.occupation, '')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Completed profile fields cannot be cleared' USING ERRCODE = '22023';
  END IF;

  v_before_safe := jsonb_build_object(
    'name', v_before.name,
    'whatsapp', v_before.whatsapp,
    'age', v_before.age,
    'bloodGroup', v_before.blood_group,
    'address', v_before.address,
    'occupation', v_before.occupation,
    'biometricEnabled', v_before.biometric_enabled
  );
  v_after_safe := jsonb_build_object(
    'name', v_after.name,
    'whatsapp', v_after.whatsapp,
    'age', v_after.age,
    'bloodGroup', v_after.blood_group,
    'address', v_after.address,
    'occupation', v_after.occupation,
    'biometricEnabled', v_after.biometric_enabled
  );

  PERFORM record_audit_event(
    NULL,
    COALESCE(NULLIF(p_actor_name, ''), 'Member'),
    'member.profile_updated',
    'member',
    p_member_id::TEXT,
    'Member updated own profile',
    'info',
    v_before_safe,
    v_after_safe,
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

REVOKE EXECUTE ON FUNCTION member_complete_profile(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION member_complete_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
