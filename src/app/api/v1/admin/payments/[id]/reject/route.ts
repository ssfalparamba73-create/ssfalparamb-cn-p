import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError, validationError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getAdminPaymentService } from "@/lib/backend/composition/adminPaymentService.server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      body = {};
    }

    const service = getAdminPaymentService();
    const result = await service.rejectPayment({ paymentId: id, reason: body.reason }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Reject payment error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}


