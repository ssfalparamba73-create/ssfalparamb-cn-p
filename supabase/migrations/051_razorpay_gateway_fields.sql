-- Razorpay order/payment reconciliation fields.
-- Apply this migration after the existing payment tables migration.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT,
  ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_signature TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id
  ON payments(gateway_order_id)
  WHERE gateway_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id
  ON payments(gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;
