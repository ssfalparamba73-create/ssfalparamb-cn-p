import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'member' || !actor.memberId) {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const service = getPaymentService();
    const result = await service.listMemberPayments(actor.memberId, { page, pageSize }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Payments error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

