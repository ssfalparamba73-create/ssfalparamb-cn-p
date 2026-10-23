-- Reduce first-login completion to the fields members can provide quickly.
-- Existing member data and the broader member-edit workflow remain available.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- A student answer is now a standalone status; study details are not required
-- during first-login completion.
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_student_details_check;

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
  v_date_of_birth DATE;
  v_blood_group blood_group;
  v_donor_available BOOLEAN;
  v_is_student BOOLEAN;
BEGIN
  IF p_input IS NULL OR jsonb_typeof(p_input) <> 'object' THEN
    RAISE EXCEPTION 'Invalid profile completion input' USING ERRCODE = '22023';
  END IF;

  v_whatsapp := NULLIF(btrim(COALESCE(p_input->>'whatsapp', '')), '');
  IF v_whatsapp IS NULL OR v_whatsapp !~ '^\d{7,15}$' THEN
    RAISE EXCEPTION 'A valid WhatsApp number is required' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(p_input->>'dateOfBirth', '') IS NULL THEN
    RAISE EXCEPTION 'Date of birth is required' USING ERRCODE = '22023';
  END IF;
  v_date_of_birth := (p_input->>'dateOfBirth')::DATE;
  IF v_date_of_birth > CURRENT_DATE OR v_date_of_birth < (CURRENT_DATE - INTERVAL '130 years')::DATE THEN
    RAISE EXCEPTION 'Date of birth is outside the supported age range' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(p_input->>'bloodGroup', '') IS NULL THEN
    RAISE EXCEPTION 'Blood group is required' USING ERRCODE = '22023';
  END IF;
  v_blood_group := (p_input->>'bloodGroup')::blood_group;
  IF jsonb_typeof(p_input->'donorAvailable') <> 'boolean' THEN
    RAISE EXCEPTION 'Donor availability is required' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_input->'isStudent') <> 'boolean' THEN
    RAISE EXCEPTION 'Student status is required' USING ERRCODE = '22023';
  END IF;
  v_donor_available := (p_input->>'donorAvailable')::BOOLEAN;
  v_is_student := (p_input->>'isStudent')::BOOLEAN;

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
      date_of_birth = v_date_of_birth,
      age = EXTRACT(YEAR FROM age(CURRENT_DATE, v_date_of_birth))::INTEGER,
      blood_group = v_blood_group,
      is_blood_donor = v_donor_available,
      donor_available = v_donor_available,
      is_student = v_is_student,
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
  IF p_input ? 'area' AND NULLIF(btrim(COALESCE(p_input->>'area', '')), '') IS NULL THEN
    RAISE EXCEPTION 'Block is required' USING ERRCODE = '22023';
  END IF;
  IF p_input ? 'area' AND NOT EXISTS (
    SELECT 1
    FROM app_settings AS setting,
      jsonb_array_elements_text(setting.value) AS configured(block)
    WHERE setting.namespace = 'unit'
      AND setting.key = 'areas'
      AND configured.block = btrim(p_input->>'area')
  ) THEN
    RAISE EXCEPTION 'Selected Block is not configured' USING ERRCODE = '22023';
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
    area = CASE WHEN p_input ? 'area' THEN NULLIF(btrim(p_input->>'area'), '') ELSE area END,
    occupation = CASE
      WHEN COALESCE(CASE WHEN p_input ? 'isStudent' THEN (p_input->>'isStudent')::BOOLEAN ELSE is_student END, FALSE)
        OR COALESCE(CASE WHEN p_input ? 'isMuthaallim' THEN (p_input->>'isMuthaallim')::BOOLEAN ELSE is_muthaallim END, FALSE)
        THEN NULL
      WHEN p_input ? 'occupation' THEN NULLIF(btrim(p_input->>'occupation'), '')
      ELSE occupation
    END,
    is_student = CASE WHEN p_input ? 'isStudent' THEN COALESCE((p_input->>'isStudent')::BOOLEAN, FALSE) ELSE is_student END,
    student_class = CASE WHEN p_input ? 'isStudent' AND NOT COALESCE((p_input->>'isStudent')::BOOLEAN, FALSE) THEN NULL WHEN p_input ? 'studentClass' THEN NULLIF(btrim(p_input->>'studentClass'), '') ELSE student_class END,
    student_course = CASE WHEN p_input ? 'isStudent' AND NOT COALESCE((p_input->>'isStudent')::BOOLEAN, FALSE) THEN NULL WHEN p_input ? 'studentCourse' THEN NULLIF(btrim(p_input->>'studentCourse'), '') ELSE student_course END,
    student_institution = CASE WHEN p_input ? 'isStudent' AND NOT COALESCE((p_input->>'isStudent')::BOOLEAN, FALSE) THEN NULL WHEN p_input ? 'studentInstitution' THEN NULLIF(btrim(p_input->>'studentInstitution'), '') ELSE student_institution END,
    is_muthaallim = CASE WHEN p_input ? 'isMuthaallim' THEN COALESCE((p_input->>'isMuthaallim')::BOOLEAN, FALSE) ELSE is_muthaallim END,
    muthaallim_institution = CASE WHEN p_input ? 'isMuthaallim' AND NOT COALESCE((p_input->>'isMuthaallim')::BOOLEAN, FALSE) THEN NULL WHEN p_input ? 'muthaallimInstitution' THEN NULLIF(btrim(p_input->>'muthaallimInstitution'), '') ELSE muthaallim_institution END,
    work_location = CASE
      WHEN COALESCE(CASE WHEN p_input ? 'isStudent' THEN (p_input->>'isStudent')::BOOLEAN ELSE is_student END, FALSE)
        OR COALESCE(CASE WHEN p_input ? 'isMuthaallim' THEN (p_input->>'isMuthaallim')::BOOLEAN ELSE is_muthaallim END, FALSE)
        THEN NULL
      WHEN p_input ? 'workLocation' THEN NULLIF(p_input->>'workLocation', '')
      ELSE work_location
    END,
    biometric_enabled = CASE WHEN p_input ? 'biometricEnabled' THEN COALESCE((p_input->>'biometricEnabled')::BOOLEAN, FALSE) ELSE biometric_enabled END,
    updated_at = NOW()
  WHERE id = p_member_id
  RETURNING * INTO v_after;

  IF v_before.profile_completed_at IS NOT NULL AND (
    v_after.age IS NULL OR
    v_after.blood_group IS NULL OR
    NULLIF(btrim(COALESCE(v_after.whatsapp, '')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Completed profile fields cannot be cleared' USING ERRCODE = '22023';
  END IF;

  v_before_safe := jsonb_build_object(
    'name', v_before.name,
    'whatsapp', v_before.whatsapp,
    'age', v_before.age,
    'bloodGroup', v_before.blood_group,
    'address', v_before.address,
    'area', v_before.area,
    'occupation', v_before.occupation,
    'isStudent', v_before.is_student,
    'studentClass', v_before.student_class,
    'studentCourse', v_before.student_course,
    'studentInstitution', v_before.student_institution,
    'isMuthaallim', v_before.is_muthaallim,
    'muthaallimInstitution', v_before.muthaallim_institution,
    'workLocation', v_before.work_location,
    'biometricEnabled', v_before.biometric_enabled
  );
  v_after_safe := jsonb_build_object(
    'name', v_after.name,
    'whatsapp', v_after.whatsapp,
    'age', v_after.age,
    'bloodGroup', v_after.blood_group,
    'address', v_after.address,
    'area', v_after.area,
    'occupation', v_after.occupation,
    'isStudent', v_after.is_student,
    'studentClass', v_after.student_class,
    'studentCourse', v_after.student_course,
    'studentInstitution', v_after.student_institution,
    'isMuthaallim', v_after.is_muthaallim,
    'muthaallimInstitution', v_after.muthaallim_institution,
    'workLocation', v_after.work_location,
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
REVOKE EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION member_complete_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
