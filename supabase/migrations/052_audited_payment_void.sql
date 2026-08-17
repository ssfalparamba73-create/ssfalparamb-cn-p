-- Audited, reversible payment removal for Super Admins.
-- This deliberately does not delete gateway or receipt records.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS voided_by_admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS void_reason text;

CREATE INDEX IF NOT EXISTS idx_payments_voided_at ON payments (voided_at) WHERE voided_at IS NOT NULL;

INSERT INTO permissions (code, description)
VALUES ('payments.void', 'Void payments with an audit trail')
ON CONFLICT (code) DO NOTHING;

-- Only the Super Admin role receives this destructive-looking financial action.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'payments.void'
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Super admins can void payments" ON payments;
CREATE POLICY "Super admins can void payments" ON payments
  FOR UPDATE
  USING (has_permission('payments.void') OR is_super_admin())
  WITH CHECK (has_permission('payments.void') OR is_super_admin());
