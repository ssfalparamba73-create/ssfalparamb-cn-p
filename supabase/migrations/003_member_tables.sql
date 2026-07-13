CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  new_code := 'MEM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT UNIQUE NOT NULL DEFAULT generate_member_code(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  alternate_phone TEXT,
  whatsapp TEXT,
  age INT,
  blood_group blood_group,
  is_blood_donor BOOLEAN DEFAULT false,
  donor_available BOOLEAN DEFAULT false,
  address TEXT,
  area TEXT,
  unit TEXT,
  sector TEXT,
  occupation TEXT,
  family_count INT DEFAULT 0,
  status member_status DEFAULT 'active',
  monthly_tier monthly_tier DEFAULT 'base',
  monthly_amount DECIMAL(10,2) DEFAULT 0,
  pin_status pin_status DEFAULT 'not_issued',
  pin_hash TEXT,
  biometric_enabled BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_paid_at TIMESTAMPTZ,
  dues_pending DECIMAL(10,2) DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  age INT,
  blood_group blood_group,
  is_blood_donor BOOLEAN DEFAULT false,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
