-- Structured member employment/study status. Existing rows remain valid with NULL
-- until an admin or member confirms the value.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS occupation_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'members_occupation_status_check'
      AND conrelid = 'members'::regclass
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT members_occupation_status_check
      CHECK (
        occupation_status IS NULL OR occupation_status IN (
          'student', 'employed', 'self_employed', 'not_employed', 'other'
        )
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_members_occupation_status
  ON members (occupation_status)
  WHERE status <> 'left';
CREATE OR REPLACE FUNCTION admin_create_member(
  p_input JSONB,
  p_family JSONB,
  p_actor_admin_id UUID,
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
  v_member members%ROWTYPE;
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid member input' USING ERRCODE = '22023';
  END IF;
  IF p_family IS NOT NULL AND jsonb_typeof(p_family) <> 'array' THEN
    RAISE EXCEPTION 'Invalid family input' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_input->>'status', 'active') = 'left' THEN
    RAISE EXCEPTION 'Cannot create a left member' USING ERRCODE = '22023';
  END IF;

  INSERT INTO members (
    name,
    phone,
    alternate_phone,
    age,
    address,
    area,
    occupation,
    occupation_status,
    status,
    monthly_tier,
    monthly_amount,
    joined_at,
    blood_group,
    is_blood_donor,
    donor_available
  ) VALUES (
    p_input->>'name',
    p_input->>'phone',
    NULLIF(p_input->>'alternatePhone', ''),
    NULLIF(p_input->>'age', '')::INTEGER,
    NULLIF(p_input->>'address', ''),
    NULLIF(p_input->>'area', ''),
    NULLIF(p_input->>'occupation', ''),
    NULLIF(p_input->>'occupationStatus', ''),
    COALESCE(NULLIF(p_input->>'status', ''), 'active')::member_status,
    COALESCE(NULLIF(p_input->>'monthlyTier', ''), 'flexible')::monthly_tier,
    (p_input->>'monthlyAmount')::NUMERIC,
    COALESCE(NULLIF(p_input->>'joinedAt', '')::TIMESTAMPTZ, NOW()),
    NULLIF(p_input->>'bloodGroup', '')::blood_group,
    COALESCE((p_input->>'isBloodDonor')::BOOLEAN, FALSE),
    CASE
      WHEN COALESCE((p_input->>'isBloodDonor')::BOOLEAN, FALSE)
        THEN COALESCE((p_input->>'donorAvailable')::BOOLEAN, FALSE)
      ELSE FALSE
    END
  )
  RETURNING * INTO v_member;

  IF p_family IS NOT NULL THEN
    INSERT INTO family_members (
      member_id,
      name,
      relationship,
      age,
      blood_group,
      is_blood_donor,
      phone
    )
    SELECT
      v_member.id,
      family->>'name',
      family->>'relationship',
      NULLIF(family->>'age', '')::INTEGER,
      NULLIF(family->>'bloodGroup', '')::blood_group,
      COALESCE((family->>'isBloodDonor')::BOOLEAN, FALSE),
      NULLIF(family->>'phone', '')
    FROM jsonb_array_elements(p_family) AS family;
  END IF;

  UPDATE members
  SET family_count = (SELECT COUNT(*) FROM family_members WHERE member_id = v_member.id),
      updated_at = NOW()
  WHERE id = v_member.id
  RETURNING * INTO v_member;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'member.created',
    'member',
    v_member.id::TEXT,
    'Member record created',
    'info',
    NULL,
    to_jsonb(v_member) - 'pin_hash',
    p_ip,
    p_device
  );

  RETURN NEXT v_member;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_member(
  p_member_id UUID,
  p_input JSONB,
  p_family JSONB,
  p_actor_admin_id UUID,
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
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid member input' USING ERRCODE = '22023';
  END IF;
  IF p_family IS NOT NULL AND jsonb_typeof(p_family) <> 'array' THEN
    RAISE EXCEPTION 'Invalid family input' USING ERRCODE = '22023';
  END IF;
  IF p_input ? 'status' AND p_input->>'status' = 'left' THEN
    RAISE EXCEPTION 'Use soft delete for left members' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_before FROM members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_before.status = 'left' THEN
    RAISE EXCEPTION 'Cannot update a left member' USING ERRCODE = '22023';
  END IF;

  UPDATE members
  SET
    name = CASE WHEN p_input ? 'name' THEN p_input->>'name' ELSE name END,
    phone = CASE WHEN p_input ? 'phone' THEN p_input->>'phone' ELSE phone END,
    alternate_phone = CASE WHEN p_input ? 'alternatePhone' THEN NULLIF(p_input->>'alternatePhone', '') ELSE alternate_phone END,
    age = CASE WHEN p_input ? 'age' THEN NULLIF(p_input->>'age', '')::INTEGER ELSE age END,
    address = CASE WHEN p_input ? 'address' THEN NULLIF(p_input->>'address', '') ELSE address END,
    area = CASE WHEN p_input ? 'area' THEN NULLIF(p_input->>'area', '') ELSE area END,
    occupation = CASE WHEN p_input ? 'occupation' THEN NULLIF(p_input->>'occupation', '') ELSE occupation END,
    occupation_status = CASE WHEN p_input ? 'occupationStatus' THEN NULLIF(p_input->>'occupationStatus', '') ELSE occupation_status END,
    status = CASE WHEN p_input ? 'status' THEN (p_input->>'status')::member_status ELSE status END,
    monthly_tier = CASE WHEN p_input ? 'monthlyTier' THEN (p_input->>'monthlyTier')::monthly_tier ELSE monthly_tier END,
    monthly_amount = CASE WHEN p_input ? 'monthlyAmount' THEN (p_input->>'monthlyAmount')::NUMERIC ELSE monthly_amount END,
    joined_at = CASE WHEN p_input ? 'joinedAt' THEN NULLIF(p_input->>'joinedAt', '')::TIMESTAMPTZ ELSE joined_at END,
    blood_group = CASE WHEN p_input ? 'bloodGroup' THEN NULLIF(p_input->>'bloodGroup', '')::blood_group ELSE blood_group END,
    is_blood_donor = CASE WHEN p_input ? 'isBloodDonor' THEN COALESCE((p_input->>'isBloodDonor')::BOOLEAN, FALSE) ELSE is_blood_donor END,
    donor_available = CASE
      WHEN p_input ? 'isBloodDonor' AND NOT COALESCE((p_input->>'isBloodDonor')::BOOLEAN, FALSE) THEN FALSE
      WHEN p_input ? 'donorAvailable' THEN COALESCE((p_input->>'donorAvailable')::BOOLEAN, FALSE)
      ELSE donor_available
    END,
    updated_at = NOW()
  WHERE id = p_member_id
  RETURNING * INTO v_after;

  IF p_family IS NOT NULL THEN
    DELETE FROM family_members WHERE member_id = p_member_id;
    INSERT INTO family_members (
      member_id,
      name,
      relationship,
      age,
      blood_group,
      is_blood_donor,
      phone
    )
    SELECT
      p_member_id,
      family->>'name',
      family->>'relationship',
      NULLIF(family->>'age', '')::INTEGER,
      NULLIF(family->>'bloodGroup', '')::blood_group,
      COALESCE((family->>'isBloodDonor')::BOOLEAN, FALSE),
      NULLIF(family->>'phone', '')
    FROM jsonb_array_elements(p_family) AS family;

    UPDATE members
    SET family_count = (SELECT COUNT(*) FROM family_members WHERE member_id = p_member_id),
        updated_at = NOW()
    WHERE id = p_member_id
    RETURNING * INTO v_after;
  END IF;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'member.updated',
    'member',
    p_member_id::TEXT,
    'Member record updated',
    'info',
    to_jsonb(v_before) - 'pin_hash',
    to_jsonb(v_after) - 'pin_hash',
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

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
  v_occupation_status TEXT;
  v_age INTEGER;
  v_blood_group blood_group;
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile completion input' USING ERRCODE = '22023';
  END IF;

  v_whatsapp := NULLIF(btrim(COALESCE(p_input->>'whatsapp', '')), '');
  v_address := NULLIF(btrim(COALESCE(p_input->>'address', '')), '');
  v_occupation := NULLIF(btrim(COALESCE(p_input->>'occupation', '')), '');
  v_occupation_status := NULLIF(btrim(COALESCE(p_input->>'occupationStatus', '')), '');

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
  IF v_occupation_status IS NULL OR v_occupation_status NOT IN ('student', 'employed', 'self_employed', 'not_employed', 'other') THEN
    RAISE EXCEPTION 'A valid employment / study status is required' USING ERRCODE = '22023';
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
      occupation_status = v_occupation_status,
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
    occupation_status = CASE WHEN p_input ? 'occupationStatus' THEN NULLIF(p_input->>'occupationStatus', '') ELSE occupation_status END,
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
    'occupationStatus', v_before.occupation_status,
    'biometricEnabled', v_before.biometric_enabled
  );
  v_after_safe := jsonb_build_object(
    'name', v_after.name,
    'whatsapp', v_after.whatsapp,
    'age', v_after.age,
    'bloodGroup', v_after.blood_group,
    'address', v_after.address,
    'occupation', v_after.occupation,
    'occupationStatus', v_after.occupation_status,
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
REVOKE EXECUTE ON FUNCTION admin_create_member(JSONB, JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_member(UUID, JSONB, JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION member_complete_profile(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION admin_create_member(JSONB, JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_member(UUID, JSONB, JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION member_complete_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;