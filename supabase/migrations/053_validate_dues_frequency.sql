-- Additive guard for the payment settings JSON document.
-- This migration does not change existing member dues, payments, or amounts.

UPDATE app_settings
SET value = jsonb_set(
  COALESCE(value, '{}'::JSONB),
  '{duesFrequency}',
  to_jsonb(CASE
    WHEN value->>'duesFrequency' IN ('monthly', 'bimonthly', 'quarterly')
      THEN value->>'duesFrequency'
    ELSE 'monthly'
  END),
  TRUE
),
updated_at = NOW()
WHERE namespace = 'payments'
  AND key = 'config'
  AND COALESCE(value->>'duesFrequency', '') NOT IN ('monthly', 'bimonthly', 'quarterly');

CREATE OR REPLACE FUNCTION validate_payment_config_dues_frequency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.namespace = 'payments' AND NEW.key = 'config'
     AND COALESCE(NEW.value->>'duesFrequency', 'monthly') NOT IN ('monthly', 'bimonthly', 'quarterly') THEN
    RAISE EXCEPTION 'Invalid duesFrequency. Use monthly, bimonthly, or quarterly.'
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payment_config_dues_frequency ON app_settings;
CREATE TRIGGER trg_validate_payment_config_dues_frequency
BEFORE INSERT OR UPDATE OF namespace, key, value ON app_settings
FOR EACH ROW
EXECUTE FUNCTION validate_payment_config_dues_frequency();
