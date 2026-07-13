CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_code ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_status_tier ON members(status, monthly_tier);

CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_category ON payments(status, category);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_payments_phone ON payments(payer_phone);

CREATE INDEX IF NOT EXISTS idx_receipts_public_token_hash ON payment_receipts(public_token_hash);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_admins_phone ON admin_users(phone);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_amount'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT chk_payment_amount CHECK (amount > 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_cash_amount'
  ) THEN
    ALTER TABLE cash_entries ADD CONSTRAINT chk_cash_amount CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_special_event_minimum_amount'
  ) THEN
    ALTER TABLE special_events ADD CONSTRAINT chk_special_event_minimum_amount CHECK (minimum_amount > 0);
  END IF;
END $$;
