import type { BackendError } from "@/lib/backend/errors/BackendError";
import type { BackendResult } from "@/lib/backend/contracts/common.contract";
import { clearProtectedQueryCache } from "@/lib/client/queryCache";
import { clearAppQueryCache } from "@/lib/client/appQueryClient";
import { fetchQuery } from "@/lib/client/queryCache";

function clearProtectedCaches(): void {
  clearProtectedQueryCache();
  clearAppQueryCache();
}

export class BackendApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(error: BackendError, status: number) {
    super(error.message);
    this.name = "BackendApiError";
    this.code = error.code;
    this.status = status;
  }
}

export async function requestBackend<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  const bypassAdminCache = headers.get("x-ssf-admin-cache-bypass") === "1";
  const isAdminRead = method === "GET" && path.startsWith("/api/v1/admin/") && !bypassAdminCache;

  if (isAdminRead) {
    // Bump dashboard cache namespace after payment void filtering was enabled.
    // This prevents an older persisted dashboard snapshot from resurfacing.
    const cacheKey = path.includes("/dashboard") ? `admin:api:v2:${path}` : `admin:api:${path}`;
    const staleTime = path.includes("/dashboard")
      ? 30_000
      : path.includes("/settings/")
        ? 15 * 60_000
        : 60_000;
    return fetchQuery(
      cacheKey,
      () => requestBackend<T>(path, {
        ...init,
        headers: new Headers({ ...Object.fromEntries(headers.entries()), "x-ssf-admin-cache-bypass": "1" }),
      }),
      { staleTime, staleWhileRevalidate: true }
    );
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const result = (await response.json()) as BackendResult<T>;
  if (!response.ok || !result.ok || result.data === null) {
    if (response.status === 401 || response.status === 403) {
      clearProtectedCaches();
    }
    if (result.error) throw new BackendApiError(result.error, response.status);
    throw new Error("The server returned an invalid response.");
  }

  return result.data;
}

export async function requestBackendVoid(
  path: string,
  init: RequestInit = {}
): Promise<void> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  const result = (await response.json()) as BackendResult<unknown>;
  if (!response.ok || !result.ok) {
    if (response.status === 401 || response.status === 403) {
      clearProtectedCaches();
    }
    if (result.error) throw new BackendApiError(result.error, response.status);
    throw new Error("The server returned an invalid response.");
  }
}
