import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminPaymentService } from "@/lib/backend/composition/adminPaymentService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
    const page = Number(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || "50");
    const result = await getAdminPaymentService().listPayments(
      { memberId: (await params).id },
      { page, pageSize },
      actorResult.data!,
    );
    return createBackendResponse(result, context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
