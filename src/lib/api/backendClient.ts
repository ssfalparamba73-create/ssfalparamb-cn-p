import type { BackendError } from "@/lib/backend/errors/BackendError";
import type { BackendResult } from "@/lib/backend/contracts/common.contract";

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
    if (result.error) throw new BackendApiError(result.error, response.status);
    throw new Error("The server returned an invalid response.");
  }
}
