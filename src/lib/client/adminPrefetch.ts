"use client";

import { canAccessAdminPath } from "@/lib/admin/accessControl";
import { getAdminDashboard } from "@/lib/api/dashboardClient";
import { getAdminMembers } from "@/lib/api/memberClient";
import { getUnitSettings } from "@/lib/api/settingsClient";
import { fetchQuery } from "./queryCache";
import { writeCachedBlockOptions } from "./safePersistentCache";

const firstMemberPageQuery = {
  page: 1,
  pageSize: 10,
  sort: "newest" as const,
};

export function prefetchAdminRouteData(href: string, permissions: string[]): void {
  if (!canAccessAdminPath(permissions, href)) return;

  if (href === "/admin/dashboard") {
    void fetchQuery("admin:dashboard", getAdminDashboard, { staleTime: 30_000 }).catch(() => undefined);
    return;
  }

  if (href === "/admin/members") {
    const key = `admin:members:${JSON.stringify(firstMemberPageQuery)}`;
    void fetchQuery(key, () => getAdminMembers(firstMemberPageQuery), { staleTime: 30_000 }).catch(() => undefined);
    void fetchQuery("admin:unit-settings", getUnitSettings, { staleTime: 15 * 60_000 })
      .then((settings) => writeCachedBlockOptions(settings.areas))
      .catch(() => undefined);
  }
}

export function scheduleAdminPriorityPrefetch(permissions: string[]): () => void {
  prefetchAdminRouteData("/admin/dashboard", permissions);

  const run = () => prefetchAdminRouteData("/admin/members", permissions);
  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(run, { timeout: 2_000 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = globalThis.setTimeout(run, 500);
  return () => globalThis.clearTimeout(timeoutId);
}
