-- Short-lived, hashed capabilities let guest payers read their own receipt
-- without exposing payment data to anyone who only knows a payment UUID.
UPDATE auth_sessions
SET expires_at = LEAST(expires_at, created_at + INTERVAL '90 days')
WHERE revoked_at IS NULL
  AND expires_at > created_at + INTERVAL '90 days';

-- Contact submissions must go through the bounded server action so database
-- credentials and input limits cannot be bypassed through the Data API.
DROP POLICY IF EXISTS "Public can insert contact messages" ON contact_messages;
REVOKE ALL ON TABLE contact_messages FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE contact_messages TO service_role;

CREATE TABLE IF NOT EXISTS payment_receipt_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cash_entries
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_entries_idempotency_key
  ON cash_entries(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE payment_receipt_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payment_receipt_access_tokens_payment_id
  ON payment_receipt_access_tokens(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipt_access_tokens_expires_at
  ON payment_receipt_access_tokens(expires_at);

-- This table is accessed only through the server-side service-role repository.
REVOKE ALL ON TABLE payment_receipt_access_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE payment_receipt_access_tokens TO service_role;

CREATE TABLE IF NOT EXISTS public_rate_limit_buckets (
  action TEXT NOT NULL,
  key_hash TEXT NOT NULL CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (action, key_hash)
);
ALTER TABLE public_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_public_rate_limit_buckets_window
  ON public_rate_limit_buckets(window_started_at);
REVOKE ALL ON TABLE public_rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public_rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION consume_public_rate_limit(
  p_action TEXT,
  p_key_hash TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  IF p_action IS NULL OR length(p_action) = 0 OR length(p_action) > 64
    OR p_key_hash IS NULL OR p_key_hash !~ '^[a-f0-9]{64}$'
    OR p_max_requests < 1 OR p_max_requests > 1000
    OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid public rate-limit parameters' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public_rate_limit_buckets
  WHERE window_started_at < NOW() - INTERVAL '7 days';

  INSERT INTO public_rate_limit_buckets(action, key_hash, window_started_at, request_count)
  VALUES (p_action, p_key_hash, NOW(), 1)
  ON CONFLICT (action, key_hash) DO UPDATE SET
    window_started_at = CASE
      WHEN public_rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds) <= NOW()
        THEN NOW()
      ELSE public_rate_limit_buckets.window_started_at
    END,
    request_count = CASE
      WHEN public_rate_limit_buckets.window_started_at + make_interval(secs => p_window_seconds) <= NOW()
        THEN 1
      ELSE public_rate_limit_buckets.request_count + 1
    END,
    updated_at = NOW()
  RETURNING request_count INTO v_request_count;

  RETURN v_request_count <= p_max_requests;
END;
$$;
REVOKE EXECUTE ON FUNCTION consume_public_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_public_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Keep the two payment and receipt writes indivisible for online intent setup.
CREATE OR REPLACE FUNCTION create_pending_payment_atomic(
  p_member_id UUID,
  p_receipt_id TEXT,
  p_payer_phone TEXT,
  p_payer_name TEXT,
  p_category payment_category,
  p_method payment_method,
  p_amount NUMERIC,
  p_tier monthly_tier,
  p_event_id UUID,
  p_collected_by_admin_id UUID,
  p_notes TEXT,
  p_month_keys TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_id UUID;
  v_month_count INTEGER;
  v_month_amount NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_payer_phone IS NULL OR length(p_payer_phone) > 32 THEN
    RAISE EXCEPTION 'Invalid pending payment data' USING ERRCODE = '22023';
  END IF;

  v_month_count := COALESCE(cardinality(p_month_keys), 0);
  INSERT INTO payments (
    member_id, receipt_id, payer_phone, payer_name, category, method, amount,
    status, tier, event_id, collected_by_admin_id, notes
  ) VALUES (
    p_member_id, p_receipt_id, p_payer_phone, p_payer_name, p_category, p_method, p_amount,
    'pending', p_tier, p_event_id, p_collected_by_admin_id, p_notes
  ) RETURNING id INTO v_payment_id;

  IF p_category = 'monthly_dues' AND v_month_count > 0 THEN
    v_month_amount := round(p_amount / v_month_count, 2);
    INSERT INTO payment_months (payment_id, month_key, amount)
    SELECT v_payment_id, month_key,
      CASE WHEN ordinal = v_month_count
        THEN p_amount - (v_month_amount * (v_month_count - 1))
        ELSE v_month_amount
      END
    FROM unnest(p_month_keys) WITH ORDINALITY AS months(month_key, ordinal);
  END IF;

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_pending_payment_months_atomic(
  p_payment_id UUID,
  p_amount NUMERIC,
  p_tier monthly_tier,
  p_month_keys TEXT[],
  p_method payment_method,
  p_event_id UUID,
  p_collected_by_admin_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current payments%ROWTYPE;
  v_month_count INTEGER;
  v_month_amount NUMERIC;
BEGIN
  SELECT * INTO v_current FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND OR v_current.status <> 'pending' OR v_current.voided_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  IF v_current.gateway_order_id IS NOT NULL OR v_current.gateway_payment_id IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid pending payment amount' USING ERRCODE = '22023';
  END IF;

  UPDATE payments SET
    amount = p_amount,
    tier = p_tier,
    method = p_method,
    event_id = p_event_id,
    collected_by_admin_id = p_collected_by_admin_id,
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_payment_id;
  DELETE FROM payment_months WHERE payment_id = p_payment_id;
  v_month_count := COALESCE(cardinality(p_month_keys), 0);

  IF v_current.category = 'monthly_dues' AND v_month_count > 0 THEN
    v_month_amount := round(p_amount / v_month_count, 2);
    INSERT INTO payment_months (payment_id, month_key, amount)
    SELECT p_payment_id, month_key,
      CASE WHEN ordinal = v_month_count
        THEN p_amount - (v_month_amount * (v_month_count - 1))
        ELSE v_month_amount
      END
    FROM unnest(p_month_keys) WITH ORDINALITY AS months(month_key, ordinal);
  END IF;

  RETURN TRUE;
END;
$$;

-- Cash ledger and cash-entry rows must commit or roll back together.
CREATE OR REPLACE FUNCTION record_cash_payment_atomic(
  p_idempotency_key UUID,
  p_request_hash TEXT,
  p_member_id UUID,
  p_receipt_id TEXT,
  p_payer_name TEXT,
  p_payer_phone TEXT,
  p_category payment_category,
  p_amount NUMERIC,
  p_event_id UUID,
  p_months TEXT[],
  p_received_by_admin_id UUID,
  p_received_by_admin_name TEXT,
  p_recorded_by_admin_id UUID,
  p_notes TEXT
)
RETURNS cash_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_id UUID;
  v_entry cash_entries%ROWTYPE;
  v_month_count INTEGER;
  v_month_amount NUMERIC;
BEGIN
  IF p_idempotency_key IS NULL OR p_request_hash IS NULL OR length(p_request_hash) <> 64 THEN
    RAISE EXCEPTION 'Cash idempotency data is invalid' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::TEXT, 0));
  SELECT * INTO v_entry FROM cash_entries WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_entry.idempotency_payload_hash IS DISTINCT FROM p_request_hash THEN
      RAISE EXCEPTION 'Cash idempotency key was reused with different payment details' USING ERRCODE = '22023';
    END IF;
    RETURN v_entry;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_payer_phone IS NULL OR length(p_payer_phone) > 32 THEN
    RAISE EXCEPTION 'Invalid cash payment data' USING ERRCODE = '22023';
  END IF;
  IF p_received_by_admin_id IS NULL OR p_received_by_admin_name IS NULL THEN
    RAISE EXCEPTION 'Cash receiver is required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM admin_users au
    JOIN admin_permissions ap ON ap.admin_id = au.id
    WHERE au.id = p_received_by_admin_id
      AND au.status = 'active'
      AND ap.permission_code = 'payments.record_cash'
  ) THEN
    RAISE EXCEPTION 'Cash receiver is no longer eligible' USING ERRCODE = '22023';
  END IF;
  IF p_recorded_by_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM admin_users au
    JOIN admin_permissions ap ON ap.admin_id = au.id
    WHERE au.id = p_recorded_by_admin_id
      AND au.status = 'active'
      AND ap.permission_code = 'payments.record_cash'
  ) THEN
    RAISE EXCEPTION 'Cash recorder is no longer eligible' USING ERRCODE = '22023';
  END IF;
  IF p_category = 'special_event' AND (
    p_event_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM special_events AS special_event
      WHERE special_event.id = p_event_id
        AND COALESCE(special_event.is_active, FALSE)
        AND p_amount >= special_event.minimum_amount
    )
  ) THEN
    RAISE EXCEPTION 'Cash payment event is inactive or below its minimum amount' USING ERRCODE = '22023';
  END IF;

  INSERT INTO payments (
    member_id, receipt_id, payer_name, payer_phone, category, method, amount,
    status, event_id, recorded_by_admin_id, collected_by_admin_id,
    collected_by_admin_name, paid_at, recorded_at, notes
  ) VALUES (
    p_member_id, p_receipt_id, p_payer_name, p_payer_phone, p_category, 'admin_cash_entry', p_amount,
    'confirmed', p_event_id, p_recorded_by_admin_id, p_received_by_admin_id,
    p_received_by_admin_name, NOW(), NOW(), p_notes
  ) RETURNING id INTO v_payment_id;

  v_month_count := COALESCE(cardinality(p_months), 0);
  IF p_category = 'monthly_dues' THEN
    IF v_month_count = 0 THEN
      RAISE EXCEPTION 'Monthly cash payments require at least one month' USING ERRCODE = '22023';
    END IF;
    v_month_amount := round(p_amount / v_month_count, 2);
    INSERT INTO payment_months (payment_id, month_key, amount)
    SELECT v_payment_id, month_key,
      CASE WHEN ordinal = v_month_count
        THEN p_amount - (v_month_amount * (v_month_count - 1))
        ELSE v_month_amount
      END
    FROM unnest(p_months) WITH ORDINALITY AS months(month_key, ordinal);
  END IF;

  INSERT INTO cash_entries (
    payment_id, member_id, payer_name, payer_phone, category, amount, months,
    event_id, received_by_admin_id, received_by_admin_name, notes, status,
    idempotency_key, idempotency_payload_hash
  ) VALUES (
    v_payment_id, p_member_id, p_payer_name, p_payer_phone, p_category, p_amount, p_months,
    p_event_id, p_received_by_admin_id, p_received_by_admin_name, p_notes, 'recorded',
    p_idempotency_key, p_request_hash
  ) RETURNING * INTO v_entry;

  INSERT INTO payment_receipts (
    payment_id, receipt_id, public_token_hash, token_expires_at, amount, issued_at
  ) VALUES (
    v_payment_id,
    p_receipt_id,
    encode(extensions.digest(gen_random_uuid()::TEXT, 'sha256'), 'hex'),
    NULL,
    p_amount,
    NOW()
  );

  RETURN v_entry;
END;
$$;

-- Bind the provider order only if the full checkout terms still match the
-- snapshot used to create that order. This closes the edit/create race.
CREATE OR REPLACE FUNCTION claim_razorpay_order_if_unchanged(
  p_payment_id UUID,
  p_gateway_order_id TEXT,
  p_expected_member_id UUID,
  p_expected_payer_phone TEXT,
  p_expected_payer_name TEXT,
  p_expected_category payment_category,
  p_expected_method payment_method,
  p_expected_amount NUMERIC,
  p_expected_tier monthly_tier,
  p_expected_event_id UUID,
  p_expected_collected_by_admin_id UUID,
  p_expected_notes TEXT,
  p_expected_month_keys TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claimed_payment_id UUID;
BEGIN
  IF p_gateway_order_id IS NULL OR length(p_gateway_order_id) = 0 OR length(p_gateway_order_id) > 128 THEN
    RAISE EXCEPTION 'Razorpay order identifier is invalid' USING ERRCODE = '22023';
  END IF;

  UPDATE payments AS p
  SET gateway_order_id = p_gateway_order_id,
      gateway_provider = 'razorpay'
  WHERE p.id = p_payment_id
    AND p.status = 'pending'
    AND p.voided_at IS NULL
    AND p.gateway_order_id IS NULL
    AND p.gateway_payment_id IS NULL
    AND (p.gateway_provider IS NULL OR p.gateway_provider = 'razorpay')
    AND p.member_id IS NOT DISTINCT FROM p_expected_member_id
    AND p.payer_phone IS NOT DISTINCT FROM p_expected_payer_phone
    AND p.payer_name IS NOT DISTINCT FROM p_expected_payer_name
    AND p.category = p_expected_category
    AND p.method = p_expected_method
    AND p.amount = p_expected_amount
    AND p.tier IS NOT DISTINCT FROM p_expected_tier
    AND p.event_id IS NOT DISTINCT FROM p_expected_event_id
    AND p.collected_by_admin_id IS NOT DISTINCT FROM p_expected_collected_by_admin_id
    AND p.notes IS NOT DISTINCT FROM p_expected_notes
    AND COALESCE(
      (
        SELECT array_agg(pm.month_key ORDER BY pm.month_key)
        FROM payment_months AS pm
        WHERE pm.payment_id = p.id
      ),
      ARRAY[]::TEXT[]
    ) = COALESCE(p_expected_month_keys, ARRAY[]::TEXT[])
  RETURNING p.id INTO v_claimed_payment_id;

  RETURN v_claimed_payment_id IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_pending_payment_atomic(UUID, TEXT, TEXT, TEXT, payment_category, payment_method, NUMERIC, monthly_tier, UUID, UUID, TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_pending_payment_months_atomic(UUID, NUMERIC, monthly_tier, TEXT[], payment_method, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION record_cash_payment_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, payment_category, NUMERIC, UUID, TEXT[], UUID, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION claim_razorpay_order_if_unchanged(UUID, TEXT, UUID, TEXT, TEXT, payment_category, payment_method, NUMERIC, monthly_tier, UUID, UUID, TEXT, TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_pending_payment_atomic(UUID, TEXT, TEXT, TEXT, payment_category, payment_method, NUMERIC, monthly_tier, UUID, UUID, TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION update_pending_payment_months_atomic(UUID, NUMERIC, monthly_tier, TEXT[], payment_method, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION record_cash_payment_atomic(UUID, TEXT, UUID, TEXT, TEXT, TEXT, payment_category, NUMERIC, UUID, TEXT[], UUID, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION claim_razorpay_order_if_unchanged(UUID, TEXT, UUID, TEXT, TEXT, payment_category, payment_method, NUMERIC, monthly_tier, UUID, UUID, TEXT, TEXT[]) TO service_role;
