import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError } from "@/lib/backend/errors/createBackendError";
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

    const service = getAdminPaymentService();
    const result = await service.approvePayment({ paymentId: id }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Approve payment error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}


