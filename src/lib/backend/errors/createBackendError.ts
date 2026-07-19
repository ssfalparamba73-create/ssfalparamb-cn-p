import type { BackendError, BackendErrorType } from "./BackendError";
import type { ErrorCode } from "./errorCodes";
import { ERROR_CODES } from "./errorCodes";

export interface CreateBackendErrorInput {
  code: ErrorCode;
  type: BackendErrorType;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export function createBackendError(input: CreateBackendErrorInput): BackendError {
  return {
    code: input.code,
    type: input.type,
    message: input.message,
    field: input.field,
    details: input.details,
    retryable: input.retryable ?? false,
  };
}

export function validationError(
  message: string,
  field?: string,
  code: ErrorCode = ERROR_CODES.VALIDATION_FAILED
): BackendError {
  return createBackendError({
    code,
    type: "validation",
    message,
    field,
    retryable: false,
  });
}

export function authError(
  message: string,
  code: ErrorCode = ERROR_CODES.LOGIN_REQUIRED
): BackendError {
  return createBackendError({
    code,
    type: "auth",
    message,
    retryable: false,
  });
}

export function permissionError(
  message: string,
  code: ErrorCode = ERROR_CODES.PERMISSION_DENIED
): BackendError {
  return createBackendError({
    code,
    type: "permission",
    message,
    retryable: false,
  });
}

export function rateLimitError(
  message = "Too many attempts. Please try again later."
): BackendError {
  return createBackendError({
    code: ERROR_CODES.TOO_MANY_ATTEMPTS,
    type: "rate_limit",
    message,
    retryable: true,
  });
}

export function notFoundError(
  message: string,
  code: ErrorCode
): BackendError {
  return createBackendError({
    code,
    type: "not_found",
    message,
    retryable: false,
  });
}

export function conflictError(
  message: string,
  code: ErrorCode
): BackendError {
  return createBackendError({
    code,
    type: "conflict",
    message,
    retryable: false,
  });
}

export function serverError(
  message = "Something went wrong. Please try again later."
): BackendError {
  return createBackendError({
    code: ERROR_CODES.INTERNAL_ERROR,
    type: "server",
    message,
    retryable: true,
  });
}
