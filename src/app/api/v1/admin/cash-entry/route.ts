import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
    return createBackendResponse(
      await getPaymentService().recordCashEntry(await request.json(), actorResult.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
