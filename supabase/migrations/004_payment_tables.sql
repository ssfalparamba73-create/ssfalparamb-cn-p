CREATE TABLE IF NOT EXISTS special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  minimum_amount DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_member_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  amount_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  receipt_id TEXT UNIQUE NOT NULL,
  payer_phone TEXT NOT NULL,
  payer_name TEXT,
  category payment_category NOT NULL,
  method payment_method NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  tier monthly_tier,
  event_id UUID REFERENCES special_events(id) ON DELETE SET NULL,
  event_name TEXT,
  collected_by_admin_id UUID,
  collected_by_admin_name TEXT,
  recorded_by_admin_id UUID,
  verified_by_admin_id UUID,
  reference_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  label TEXT,
  amount DECIMAL(10,2) NOT NULL,
  UNIQUE(payment_id, month_key)
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id TEXT UNIQUE NOT NULL,
  payment_id UUID UNIQUE NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  public_token_hash TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ,
  amount DECIMAL(10,2) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  receipt_theme TEXT DEFAULT 'default',
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  payer_name TEXT,
  payer_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category payment_category NOT NULL,
  event_id UUID REFERENCES special_events(id) ON DELETE SET NULL,
  months TEXT[],
  received_by_admin_id UUID NOT NULL,
  received_by_admin_name TEXT NOT NULL,
  status cash_entry_status DEFAULT 'recorded',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
