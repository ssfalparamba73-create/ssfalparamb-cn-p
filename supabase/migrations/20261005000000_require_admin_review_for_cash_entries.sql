-- Cash payments entered by an admin must remain pending until a permitted
-- admin reviews them. Existing confirmed rows are intentionally unchanged.

CREATE OR REPLACE FUNCTION enforce_admin_cash_entry_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.method = 'admin_cash_entry' THEN
    NEW.status := 'pending';
    NEW.paid_at := NULL;
    NEW.verified_by_admin_id := NULL;
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_require_admin_cash_entry_review ON payments;
CREATE TRIGGER payments_require_admin_cash_entry_review
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION enforce_admin_cash_entry_pending();

CREATE OR REPLACE FUNCTION review_manual_cash_payment_atomic(
  p_payment_id UUID,
  p_actor_admin_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_next_status payment_status;
  v_cash_status cash_entry_status;
BEGIN
  IF p_actor_admin_id IS NULL OR p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Cash payment review request is invalid' USING ERRCODE = '22023';
  END IF;

  IF p_action = 'approve' THEN
    v_next_status := 'confirmed';
    v_cash_status := 'verified';
  ELSE
    v_next_status := 'rejected';
    v_cash_status := 'disputed';
  END IF;

  UPDATE payments AS payment
  SET status = v_next_status,
      paid_at = CASE WHEN p_action = 'approve' THEN NOW() ELSE payment.paid_at END,
      verified_by_admin_id = p_actor_admin_id,
      verified_at = NOW(),
      notes = p_notes,
      updated_at = NOW()
  WHERE payment.id = p_payment_id
    AND payment.status = 'pending'
    AND payment.method IN ('cash_handover', 'admin_cash_entry')
    AND payment.gateway_order_id IS NULL
    AND payment.gateway_payment_id IS NULL
    AND payment.voided_at IS NULL
  RETURNING payment.* INTO v_payment;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only pending manual cash payments can be reviewed' USING ERRCODE = 'P0001';
  END IF;

  UPDATE cash_entries
  SET status = v_cash_status,
      verified_at = NOW(),
      updated_at = NOW()
  WHERE payment_id = p_payment_id
    AND status IN ('received', 'recorded');

  RETURN v_payment;
END;
$$;

REVOKE EXECUTE ON FUNCTION review_manual_cash_payment_atomic(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION review_manual_cash_payment_atomic(UUID, UUID, TEXT, TEXT) TO service_role;
