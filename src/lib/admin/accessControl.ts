export const ADMIN_ROUTE_ACCESS = [
  { prefix: "/admin/settings/admins", permissions: ["admin_users.manage"] },
  { prefix: "/admin/settings", permissions: ["settings.view"] },
  { prefix: "/admin/audit-log", permissions: ["audit.view"] },
  { prefix: "/admin/reports", permissions: ["reports.view"] },
  { prefix: "/admin/cash-entry", permissions: ["payments.record_cash"] },
  { prefix: "/admin/payments", permissions: ["payments.view"] },
  { prefix: "/admin/defaulters", permissions: ["members.view", "payments.view"] },
  { prefix: "/admin/blood-donors", permissions: ["members.view"] },
  { prefix: "/admin/members", permissions: ["members.view"] },
  { prefix: "/admin/events", permissions: ["settings.view"] },
  { prefix: "/admin/dashboard", permissions: ["dashboard.view"] },
] as const;

export function hasAdminPermissions(
  granted: readonly string[] | undefined,
  required: readonly string[]
): boolean {
  if (!granted) return false;
  return required.every((permission) => granted.includes(permission));
}

export function canAccessAdminPath(
  granted: readonly string[] | undefined,
  pathname: string
): boolean {
  const rule = ADMIN_ROUTE_ACCESS.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (rule) return hasAdminPermissions(granted, rule.permissions);
  return pathname === "/admin";
}
