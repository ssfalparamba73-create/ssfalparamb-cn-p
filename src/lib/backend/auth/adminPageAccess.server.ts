import "server-only";

import { getAuthService } from "../composition/authService.server";
import { readSessionCookie } from "./sessionCookie";

export type AdminPageAccess =
  | { ok: true; actorId: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/** Resolve and authorize an admin session before a Server Component reads private data. */
export async function requireAdminPagePermission(
  permission: string
): Promise<AdminPageAccess> {
  const rawToken = await readSessionCookie();
  if (!rawToken) return { ok: false, reason: "unauthenticated" };

  const result = await getAuthService().getCurrentSession(rawToken);
  if (!result.ok || result.data?.actorType !== "admin") {
    return { ok: false, reason: "unauthenticated" };
  }

  const session = result.data;
  if (
    !session.permissions?.includes(permission) &&
    session.actorRole !== "super_admin"
  ) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, actorId: session.actorId };
}
