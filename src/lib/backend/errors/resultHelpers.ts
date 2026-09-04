import type {
  BackendResult,
  BackendResultMeta,
} from "../contracts/common.contract";
import type { BackendError } from "./BackendError";
import { ERROR_CODES } from "./errorCodes";

export function ok<T>(
  data: T,
  meta?: BackendResultMeta
): BackendResult<T> {
  return {
    ok: true,
    data,
    error: null,
    meta,
  };
}

export function emptyOk(meta?: BackendResultMeta): BackendResult<void> {
  return {
    ok: true,
    data: undefined,
    error: null,
    meta,
  };
}

export function fail<T = never>(
  error: BackendError,
  meta?: BackendResultMeta
): BackendResult<T> {
  return {
    ok: false,
    data: null,
    error,
    meta,
  };
}

export function fromThrowable(error: unknown): BackendError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "type" in error &&
    "message" in error
  ) {
    return error as BackendError;
  }

  const realMessage = error instanceof Error ? error.message : "Unknown error";

  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    type: "server",
    message: `Debug Error: ${realMessage}`,
    retryable: true,
  };
}
