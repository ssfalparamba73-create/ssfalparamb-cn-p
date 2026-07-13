INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'Full system access', true),
  ('president', 'President level access', true),
  ('secretary', 'Secretary level access', true),
  ('treasurer', 'Treasurer level access', true),
  ('collector', 'Can collect cash and record', true),
  ('viewer', 'Can only view data', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('members.view', 'View members'),
  ('members.create', 'Create members'),
  ('members.update', 'Update members'),
  ('members.delete', 'Delete members'),
  ('payments.view', 'View payments'),
  ('payments.record_cash', 'Record cash entry'),
  ('payments.verify', 'Verify payments'),
  ('payments.cancel', 'Cancel payments'),
  ('dashboard.view', 'View dashboard'),
  ('audit.view', 'View audit logs'),
  ('settings.view', 'View settings'),
  ('settings.update', 'Update settings'),
  ('reports.view', 'View reports'),
  ('reports.export', 'Export reports'),
  ('admin_users.manage', 'Manage admin users')
ON CONFLICT (code) DO NOTHING;

DO $$ 
DECLARE
  v_super_admin UUID;
  v_president UUID;
  v_secretary UUID;
  v_treasurer UUID;
  v_collector UUID;
  v_viewer UUID;
BEGIN
  SELECT id INTO v_super_admin FROM roles WHERE name = 'super_admin';
  SELECT id INTO v_president FROM roles WHERE name = 'president';
  SELECT id INTO v_secretary FROM roles WHERE name = 'secretary';
  SELECT id INTO v_treasurer FROM roles WHERE name = 'treasurer';
  SELECT id INTO v_collector FROM roles WHERE name = 'collector';
  SELECT id INTO v_viewer FROM roles WHERE name = 'viewer';

  IF v_super_admin IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_super_admin, id FROM permissions
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_treasurer IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_treasurer, id FROM permissions WHERE code IN ('payments.view', 'payments.verify', 'reports.view', 'reports.export', 'dashboard.view')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_collector IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_collector, id FROM permissions WHERE code IN ('payments.view', 'payments.record_cash', 'members.view', 'dashboard.view')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_viewer IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_viewer, id FROM permissions WHERE code IN ('dashboard.view', 'members.view', 'payments.view', 'reports.view')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_president IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_president, id FROM permissions WHERE code != 'admin_users.manage'
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_secretary IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_secretary, id FROM permissions WHERE code IN ('members.view', 'members.create', 'members.update', 'settings.view', 'settings.update', 'dashboard.view')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Seed default settings
INSERT INTO app_settings (namespace, key, value, is_public) VALUES
  ('unit', 'name', '"Default Unit"', true),
  ('payment', 'monthly_due_base_amount', '100', true),
  ('payment', 'monthly_due_premium_amount', '200', true),
  ('receipt', 'receipt_theme', '"default"', true)
ON CONFLICT (namespace, key) DO NOTHING;
