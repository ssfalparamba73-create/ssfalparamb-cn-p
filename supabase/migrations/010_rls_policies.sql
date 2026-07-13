-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_member_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

-- App Settings
DROP POLICY IF EXISTS "Public can view public settings" ON app_settings;
CREATE POLICY "Public can view public settings" ON app_settings FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Admins with settings update can update" ON app_settings;
CREATE POLICY "Admins with settings update can update" ON app_settings FOR ALL USING (has_permission('settings.update') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with settings view can read all" ON app_settings;
CREATE POLICY "Admins with settings view can read all" ON app_settings FOR SELECT USING (has_permission('settings.view') OR has_permission('settings.update') OR is_super_admin());

-- Members
DROP POLICY IF EXISTS "Members can view own profile" ON members;
CREATE POLICY "Members can view own profile" ON members FOR SELECT USING (id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Admins with member view can read all" ON members;
CREATE POLICY "Admins with member view can read all" ON members FOR SELECT USING (has_permission('members.view') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with member update can update" ON members;
CREATE POLICY "Admins with member update can update" ON members FOR UPDATE USING (has_permission('members.update') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with member create can insert" ON members;
CREATE POLICY "Admins with member create can insert" ON members FOR INSERT WITH CHECK (has_permission('members.create') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with member delete can delete" ON members;
CREATE POLICY "Admins with member delete can delete" ON members FOR DELETE USING (has_permission('members.delete') OR is_super_admin());

-- Family Members
DROP POLICY IF EXISTS "Members can view own family" ON family_members;
CREATE POLICY "Members can view own family" ON family_members FOR SELECT USING (member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Admins with member view can read family" ON family_members;
CREATE POLICY "Admins with member view can read family" ON family_members FOR SELECT USING (has_permission('members.view') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with member update can manage family" ON family_members;
CREATE POLICY "Admins with member update can manage family" ON family_members FOR ALL USING (has_permission('members.update') OR is_super_admin());

-- Payments & Related
DROP POLICY IF EXISTS "Members can view own payments" ON payments;
CREATE POLICY "Members can view own payments" ON payments FOR SELECT USING (member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Members can view own payment months" ON payment_months;
CREATE POLICY "Members can view own payment months" ON payment_months FOR SELECT USING (payment_id IN (SELECT id FROM payments WHERE member_id = current_app_member_id()) AND is_active_member());

DROP POLICY IF EXISTS "Members can view own receipts" ON payment_receipts;
CREATE POLICY "Members can view own receipts" ON payment_receipts FOR SELECT USING (payment_id IN (SELECT id FROM payments WHERE member_id = current_app_member_id()) AND is_active_member());

DROP POLICY IF EXISTS "Admins with payments view can read all" ON payments;
CREATE POLICY "Admins with payments view can read all" ON payments FOR SELECT USING (has_permission('payments.view') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with payments view can read months" ON payment_months;
CREATE POLICY "Admins with payments view can read months" ON payment_months FOR SELECT USING (has_permission('payments.view') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with payments view can read receipts" ON payment_receipts;
CREATE POLICY "Admins with payments view can read receipts" ON payment_receipts FOR SELECT USING (has_permission('payments.view') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with payments verify can update payments" ON payments;
CREATE POLICY "Admins with payments verify can update payments" ON payments FOR UPDATE USING (has_permission('payments.verify') OR has_permission('payments.cancel') OR is_super_admin()) WITH CHECK (has_permission('payments.verify') OR has_permission('payments.cancel') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with record cash can insert payments" ON payments;
CREATE POLICY "Admins with record cash can insert payments" ON payments FOR INSERT WITH CHECK (has_permission('payments.record_cash') OR is_super_admin());

-- Cash Entries
DROP POLICY IF EXISTS "Admins with record cash can read cash entries" ON cash_entries;
CREATE POLICY "Admins with record cash can read cash entries" ON cash_entries FOR SELECT USING (has_permission('payments.view') OR has_permission('payments.record_cash') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with record cash can insert cash entries" ON cash_entries;
CREATE POLICY "Admins with record cash can insert cash entries" ON cash_entries FOR INSERT WITH CHECK (has_permission('payments.record_cash') OR is_super_admin());

DROP POLICY IF EXISTS "Admins with record cash can update cash entries" ON cash_entries;
CREATE POLICY "Admins with record cash can update cash entries" ON cash_entries FOR UPDATE USING (has_permission('payments.record_cash') OR is_super_admin()) WITH CHECK (has_permission('payments.record_cash') OR is_super_admin());

-- Admin RBAC
DROP POLICY IF EXISTS "Admins can view admins" ON admin_users;
CREATE POLICY "Admins can view admins" ON admin_users FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage admins" ON admin_users;
CREATE POLICY "Admins can manage admins" ON admin_users FOR ALL USING (has_permission('admin_users.manage') OR is_super_admin());

DROP POLICY IF EXISTS "Admins can view roles" ON roles;
CREATE POLICY "Admins can view roles" ON roles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view permissions" ON permissions;
CREATE POLICY "Admins can view permissions" ON permissions FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can view admin_user_roles" ON admin_user_roles;
CREATE POLICY "Admins can view admin_user_roles" ON admin_user_roles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage roles" ON admin_user_roles;
CREATE POLICY "Admins can manage roles" ON admin_user_roles FOR ALL USING (has_permission('admin_users.manage') OR is_super_admin());

DROP POLICY IF EXISTS "Admins can view role_permissions" ON role_permissions;
CREATE POLICY "Admins can view role_permissions" ON role_permissions FOR SELECT USING (is_admin());

-- Audit Logs
DROP POLICY IF EXISTS "Admins with audit view can read" ON audit_logs;
CREATE POLICY "Admins with audit view can read" ON audit_logs FOR SELECT USING (has_permission('audit.view') OR is_super_admin());

-- Special Events
DROP POLICY IF EXISTS "Public can view active events" ON special_events;
CREATE POLICY "Public can view active events" ON special_events FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Members can view event statuses" ON event_member_statuses;
CREATE POLICY "Members can view event statuses" ON event_member_statuses FOR SELECT USING (member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Admins can view events" ON special_events;
CREATE POLICY "Admins can view events" ON special_events FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage events" ON special_events;
CREATE POLICY "Admins can manage events" ON special_events FOR ALL USING (has_permission('settings.update') OR is_super_admin());

DROP POLICY IF EXISTS "Admins can view event statuses" ON event_member_statuses;
CREATE POLICY "Admins can view event statuses" ON event_member_statuses FOR SELECT USING (is_admin());

-- Notifications
DROP POLICY IF EXISTS "Members can view own notifications" ON notifications;
CREATE POLICY "Members can view own notifications" ON notifications FOR SELECT USING (member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Members can update own notifications" ON notifications;
CREATE POLICY "Members can update own notifications" ON notifications FOR UPDATE USING (member_id = current_app_member_id() AND is_active_member()) WITH CHECK (member_id = current_app_member_id() AND is_active_member());

-- Support
DROP POLICY IF EXISTS "Public can view active support contacts" ON support_contacts;
CREATE POLICY "Public can view active support contacts" ON support_contacts FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Members can view own support requests" ON support_requests;
CREATE POLICY "Members can view own support requests" ON support_requests FOR SELECT USING (member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Admins can manage support" ON support_requests;
CREATE POLICY "Admins can manage support" ON support_requests FOR ALL USING (has_permission('settings.update') OR is_super_admin());

-- Storage Files
DROP POLICY IF EXISTS "Public can view public storage" ON storage_files;
CREATE POLICY "Public can view public storage" ON storage_files FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "Members can view own storage" ON storage_files;
CREATE POLICY "Members can view own storage" ON storage_files FOR SELECT USING (owner_member_id = current_app_member_id() AND is_active_member());

DROP POLICY IF EXISTS "Admins can view storage" ON storage_files;
CREATE POLICY "Admins can view storage" ON storage_files FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage storage" ON storage_files;
CREATE POLICY "Admins can manage storage" ON storage_files FOR ALL USING (is_super_admin() OR has_permission('settings.update'));
