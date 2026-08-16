import { NextRequest } from "next/server";
import { SupabasePaymentRepository } from "@/lib/backend/adapters/supabase/repositories/supabasePaymentRepository";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { notFoundError, serverError } from "@/lib/backend/errors/createBackendError";
import { ERROR_CODES } from "@/lib/backend/errors/errorCodes";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = buildPublicActorContext(_request);
  try {
    const payment = await new SupabasePaymentRepository().findById((await params).id);
    if (!payment || payment.status !== "confirmed" || payment.voidedAt) {
      return createBackendResponse(fail(notFoundError("Confirmed receipt not found.", ERROR_CODES.PAYMENT_NOT_FOUND)), context.requestId);
    }
    return createBackendResponse(ok(payment), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
