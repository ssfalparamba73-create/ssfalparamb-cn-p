-- Revoke execute from public (which includes anon and authenticated roles by default) 
-- for all custom functions to ensure they can only be called by the trusted server (service_role)

-- 1. RLS Helpers
REVOKE EXECUTE ON FUNCTION current_app_member_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION current_app_admin_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION has_permission(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_active_member() FROM PUBLIC, anon, authenticated;

-- 2. Business Logic RPCs
REVOKE EXECUTE ON FUNCTION increment_reminder_count(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_receipt_view_count(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION generate_member_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION generate_receipt_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION hash_receipt_token(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_dashboard_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_numeric_setting(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION resolve_payment_amount(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION record_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Ensure service_role has explicit execute rights
GRANT EXECUTE ON FUNCTION current_app_member_id() TO service_role;
GRANT EXECUTE ON FUNCTION current_app_admin_id() TO service_role;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION is_super_admin() TO service_role;
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION is_active_member() TO service_role;
GRANT EXECUTE ON FUNCTION increment_reminder_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_receipt_view_count(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_member_code() TO service_role;
GRANT EXECUTE ON FUNCTION generate_receipt_id() TO service_role;
GRANT EXECUTE ON FUNCTION hash_receipt_token(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_dashboard_totals() TO service_role;
GRANT EXECUTE ON FUNCTION get_numeric_setting(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_payment_amount(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION record_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT) TO service_role;
