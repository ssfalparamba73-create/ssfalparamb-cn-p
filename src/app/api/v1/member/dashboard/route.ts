import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getDashboardService } from "@/lib/backend/composition/dashboardService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);
    return createBackendResponse(
      await getDashboardService().getMemberDashboard(actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}
