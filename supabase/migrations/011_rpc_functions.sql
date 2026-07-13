CREATE OR REPLACE FUNCTION increment_reminder_count(p_member_id UUID) RETURNS void AS $$
BEGIN
  UPDATE members SET reminder_count = reminder_count + 1 WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION increment_receipt_view_count(p_receipt_id TEXT) RETURNS void AS $$
BEGIN
  UPDATE payment_receipts SET view_count = view_count + 1 WHERE receipt_id = p_receipt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION generate_receipt_id() RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  attempt int := 0;
BEGIN
  LOOP
    attempt := attempt + 1;
    new_id := 'REC-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 8));
    
    IF NOT EXISTS (
      SELECT 1 FROM payments WHERE receipt_id = new_id
      UNION
      SELECT 1 FROM payment_receipts WHERE receipt_id = new_id
    ) THEN
      RETURN new_id;
    END IF;

    IF attempt >= 5 THEN
      RAISE EXCEPTION 'Failed to generate unique receipt ID after % attempts', attempt;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hash_receipt_token(p_token text)
RETURNS text AS $$
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RAISE EXCEPTION 'Invalid receipt token';
  END IF;

  RETURN encode(digest(p_token, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_dashboard_totals() RETURNS json AS $$
DECLARE
  res json;
BEGIN
  SELECT json_build_object(
    'total_collected', COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0),
    'monthly_dues', COALESCE(SUM(amount) FILTER (WHERE category = 'monthly_dues' AND status = 'confirmed'), 0),
    'special_events', COALESCE(SUM(amount) FILTER (WHERE category = 'special_event' AND status = 'confirmed'), 0),
    'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)
  ) INTO res FROM payments;
  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_numeric_setting(p_namespace text, p_key text)
RETURNS numeric AS $$
DECLARE
  v_value jsonb;
  v_result numeric;
BEGIN
  SELECT value INTO v_value
  FROM app_settings
  WHERE namespace = p_namespace AND key = p_key;

  IF v_value IS NULL THEN
    RAISE EXCEPTION 'Missing numeric setting %.%', p_namespace, p_key;
  END IF;

  BEGIN
    v_result := trim(both '"' from v_value::text)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid numeric setting %.%', p_namespace, p_key;
  END;

  IF v_result <= 0 THEN
    RAISE EXCEPTION 'Numeric setting %.% must be greater than zero', p_namespace, p_key;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION resolve_payment_amount(
  p_member_id UUID,
  p_category TEXT,
  p_event_id UUID DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_amount DECIMAL := 0;
  v_tier TEXT;
  v_custom_amount DECIMAL;
  v_base DECIMAL;
  v_premium DECIMAL;
BEGIN
  IF p_category = 'monthly_dues' THEN
    SELECT monthly_tier::text, monthly_amount INTO v_tier, v_custom_amount 
    FROM members WHERE id = p_member_id;
    
    IF v_tier IN ('custom', 'flexible') THEN
      IF v_custom_amount > 0 THEN
        RETURN v_custom_amount;
      ELSE
        RAISE EXCEPTION 'Custom amount not set for member %', p_member_id;
      END IF;
    END IF;

    v_base := get_numeric_setting('payment', 'monthly_due_base_amount');
    v_premium := get_numeric_setting('payment', 'monthly_due_premium_amount');
    
    IF v_tier = 'premium' THEN
      v_amount := v_premium;
    ELSIF v_tier = 'base' THEN
      v_amount := v_base;
    ELSE
      RAISE EXCEPTION 'Unknown monthly tier % for member %', v_tier, p_member_id;
    END IF;
  ELSIF p_category = 'special_event' AND p_event_id IS NOT NULL THEN
    SELECT minimum_amount INTO v_amount FROM special_events WHERE id = p_event_id;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Cannot resolve valid payment amount for category %', p_category;
  END IF;

  RETURN v_amount;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION record_audit_event(
  p_actor_admin_id UUID,
  p_actor_name TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_summary TEXT,
  p_severity TEXT DEFAULT 'info',
  p_before JSONB DEFAULT NULL,
  p_after JSONB DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_admin_id, actor_name, action, entity_type, entity_id, 
    summary, severity, before_data, after_data, ip, device
  ) VALUES (
    p_actor_admin_id, p_actor_name, p_action, p_entity_type::audit_entity_type, p_entity_id,
    p_summary, p_severity::audit_severity, p_before, p_after, p_ip, p_device
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
