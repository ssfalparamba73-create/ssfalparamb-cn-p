-- Phase 10: member-owned profile updates with a restricted field allow-list.
-- Rollback: drop member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT). Existing
-- profile values and audit rows intentionally remain unchanged.

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

REVOKE EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION member_update_profile(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
