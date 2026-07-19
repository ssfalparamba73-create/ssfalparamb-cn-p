-- Phase 10 pre-payment hardening.
-- Rollback: restore the prior function bodies only if the application is also
-- rolled back; signatures and stored data are unchanged by this migration.

CREATE OR REPLACE FUNCTION generate_receipt_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_new_id TEXT;
  v_attempt INTEGER;
BEGIN
  FOR v_attempt IN 1..5 LOOP
    v_new_id := 'REC-' || to_char(NOW(), 'YYYYMMDD') || '-' ||
      upper(substring(gen_random_uuid()::TEXT FROM 1 FOR 8));

    IF NOT EXISTS (
      SELECT 1 FROM payments WHERE receipt_id = v_new_id
      UNION ALL
      SELECT 1 FROM payment_receipts WHERE receipt_id = v_new_id
    ) THEN
      RETURN v_new_id;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Failed to generate unique receipt ID after 5 attempts';
END;
$$;

CREATE OR REPLACE FUNCTION hash_receipt_token(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RAISE EXCEPTION 'Invalid receipt token' USING ERRCODE = '22023';
  END IF;

  RETURN encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_receipt_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION hash_receipt_token(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_receipt_id() TO service_role;
GRANT EXECUTE ON FUNCTION hash_receipt_token(TEXT) TO service_role;
