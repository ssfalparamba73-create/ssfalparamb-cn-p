import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError, validationError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";

export async function POST(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'admin') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return createBackendResponse(fail(validationError("Invalid JSON body")), actor.requestId);
    }

    const service = getPaymentService();
    const result = await service.recordCashEntry(body, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Cash entry error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}


