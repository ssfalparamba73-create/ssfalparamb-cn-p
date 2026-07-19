import { NextResponse } from "next/server";
import type { BackendResult } from "../contracts/common.contract";
import { serverError } from "../errors/createBackendError";
import { fail } from "../errors/resultHelpers";

/**
 * Converts a BackendResult into a Next.js JSON Response.
 * Implements standard HTTP status code mapping and secure headers.
 */
export function createBackendResponse<T>(
  result: BackendResult<T>,
  requestId: string,
  successStatus = 200
): NextResponse {
  let status = successStatus;

  if (!result.ok) {
    switch (result.error?.code) {
      case "VALIDATION_FAILED":
      case "INVALID_PHONE":
      case "INVALID_AMOUNT":
      case "AMOUNT_TOO_LOW":
      case "MISSING_REQUIRED_FIELD":
      case "UPLOAD_TOO_LARGE":
      case "UNSUPPORTED_FILE_TYPE":
        status = 400;
        break;
      case "LOGIN_REQUIRED":
      case "SESSION_EXPIRED":
      case "INVALID_PIN":
        status = 401;
        break;
      case "PERMISSION_DENIED":
      case "ADMIN_PERMISSION_DENIED":
      case "SUPER_ADMIN_REQUIRED":
        status = 403;
        break;
      case "MEMBER_NOT_FOUND":
      case "PAYMENT_NOT_FOUND":
      case "RECEIPT_NOT_FOUND":
      case "ADMIN_NOT_FOUND":
      case "INVALID_RECEIPT_TOKEN":
      case "RECEIPT_TOKEN_EXPIRED":
        status = 404;
        break;
      case "DUPLICATE_PHONE":
      case "DUPLICATE_MEMBER_CODE":
      case "ADMIN_ALREADY_EXISTS":
      case "ADMIN_GUARD_VIOLATION":
      case "PAYMENT_ALREADY_VERIFIED":
        status = 409;
        break;
      case "INVALID_PAYMENT_STATUS_TRANSITION":
        status = 422;
        break;
      case "TOO_MANY_ATTEMPTS":
        status = 429;
        break;
      case "INTERNAL_ERROR":
      case "DATABASE_ERROR":
      case "STORAGE_UPLOAD_FAILED":
      default:
        status = 500;
        break;
    }

    if (status === 500) {
      console.error(`[${requestId}] Backend request failed.`, {
        code: result.error?.code ?? "INTERNAL_ERROR",
        type: result.error?.type ?? "server",
      });

      result = fail<T>(
        serverError("An internal server error occurred. Please try again later."),
        { requestId }
      );
    }
  }

  result = {
    ...result,
    meta: {
      ...result.meta,
      requestId,
    },
  };

  const response = NextResponse.json(result, { status });

  // Add security and tracing headers required by Phase 6
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
