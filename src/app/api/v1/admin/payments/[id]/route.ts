import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminPaymentService } from "@/lib/backend/composition/adminPaymentService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
    const body = await request.json();
    const input = { paymentId: (await params).id, reason: body.reason, notes: body.notes };
    const service = getAdminPaymentService();
    if (body.action === "approve") return createBackendResponse(await service.approvePayment(input, actorResult.data!), context.requestId);
    if (body.action === "reject") return createBackendResponse(await service.rejectPayment(input, actorResult.data!), context.requestId);
    if (body.action === "cancel") return createBackendResponse(await service.cancelPayment(input, actorResult.data!), context.requestId);
    if (body.action === "void") return createBackendResponse(await service.voidPayment(input, actorResult.data!), context.requestId);
    return createBackendResponse(fail(validationError("Invalid payment action.", "action")), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
