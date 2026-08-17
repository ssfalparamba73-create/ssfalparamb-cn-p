-- Views run with the view owner's privileges by default. Make this RBAC
-- compatibility view obey the caller's RLS policies instead.
ALTER VIEW public.admin_permissions SET (security_invoker = true);

-- Keep permission checks independent of the compatibility view. This
-- SECURITY DEFINER function is intentionally retained because the RBAC tables
-- are protected by RLS; the fixed search_path prevents object shadowing.
CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.current_app_admin_id() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_user_roles aur
    JOIN public.role_permissions rp ON rp.role_id = aur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.admin_users au ON au.id = aur.admin_id
    WHERE aur.admin_id = public.current_app_admin_id()
      AND p.code = has_permission.permission_code
      AND au.status = 'active'
  );
END;
$$;
