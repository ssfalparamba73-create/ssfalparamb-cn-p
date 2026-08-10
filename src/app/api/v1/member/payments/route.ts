import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);

    const actor = actorResult.data!;
    if (!actor.memberId) {
      return createBackendResponse(fail(serverError("Member identity is unavailable.")), context.requestId);
    }

    const page = Number(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || "50");
    return createBackendResponse(
      await getPaymentService().listMemberPayments(actor.memberId, { page, pageSize }, actor),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
