CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity audit_severity DEFAULT 'info',
  before_data JSONB,
  after_data JSONB,
  ip TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status notification_status DEFAULT 'unread',
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS storage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  checksum TEXT,
  visibility storage_visibility DEFAULT 'private',
  owner_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  uploaded_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bucket, path)
);
