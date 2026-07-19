-- Phase 9C hardening: left members cannot be restored through update, and
-- repeated soft-delete requests still revoke any unexpectedly active sessions.

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

CREATE OR REPLACE FUNCTION admin_soft_delete_member(
  p_member_id UUID,
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
  SELECT * INTO v_before FROM members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_before.status = 'left' THEN
    UPDATE auth_sessions
    SET revoked_at = NOW()
    WHERE member_id = p_member_id
      AND revoked_at IS NULL;
    RETURN NEXT v_before;
    RETURN;
  END IF;

  UPDATE members
  SET status = 'left',
      pin_status = 'reset_required',
      pin_hash = NULL,
      updated_at = NOW()
  WHERE id = p_member_id
  RETURNING * INTO v_after;

  UPDATE auth_sessions
  SET revoked_at = NOW()
  WHERE member_id = p_member_id
    AND revoked_at IS NULL;

  PERFORM record_audit_event(
    p_actor_admin_id,
    COALESCE(NULLIF(p_actor_name, ''), 'Unknown Admin'),
    'member.soft_deleted',
    'member',
    p_member_id::TEXT,
    'Member moved to left status',
    'warning',
    to_jsonb(v_before) - 'pin_hash',
    to_jsonb(v_after) - 'pin_hash',
    p_ip,
    p_device
  );

  RETURN NEXT v_after;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_member(UUID, JSONB, JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_soft_delete_member(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_member(UUID, JSONB, JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_soft_delete_member(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
