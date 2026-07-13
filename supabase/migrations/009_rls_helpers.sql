CREATE OR REPLACE FUNCTION current_app_member_id() RETURNS UUID AS $$
DECLARE
  claims JSONB;
  member_id TEXT;
BEGIN
  claims := current_setting('request.jwt.claims', true)::jsonb;
  IF claims IS NULL THEN RETURN NULL; END IF;
  member_id := claims->>'member_id';
  IF member_id IS NULL OR member_id = '' THEN RETURN NULL; END IF;
  RETURN member_id::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_app_admin_id() RETURNS UUID AS $$
DECLARE
  claims JSONB;
  admin_id TEXT;
BEGIN
  claims := current_setting('request.jwt.claims', true)::jsonb;
  IF claims IS NULL THEN RETURN NULL; END IF;
  admin_id := claims->>'admin_id';
  IF admin_id IS NULL OR admin_id = '' THEN RETURN NULL; END IF;
  RETURN admin_id::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = current_app_admin_id()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  IF current_app_admin_id() IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM admin_user_roles aur
    JOIN roles r ON aur.role_id = r.id
    JOIN admin_users au ON au.id = aur.admin_id
    WHERE aur.admin_id = current_app_admin_id() 
      AND r.name = 'super_admin'
      AND au.status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION has_permission(permission_code TEXT) RETURNS BOOLEAN AS $$
BEGIN
  IF current_app_admin_id() IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM admin_permissions ap
    JOIN admin_users au ON au.id = ap.admin_id
    WHERE ap.admin_id = current_app_admin_id() 
      AND ap.permission_code = has_permission.permission_code
      AND au.status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION is_active_member() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM members
    WHERE id = current_app_member_id()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;
