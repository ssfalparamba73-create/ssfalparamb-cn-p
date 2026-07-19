import type { NextRequest } from "next/server";
import type { AuditLogFilters } from "@/lib/backend/contracts/admin.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAuditService } from "@/lib/backend/composition/auditService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    const params = request.nextUrl.searchParams;
    const filters: AuditLogFilters = {
      search: params.get("search") || undefined,
      action: params.get("action") || undefined,
      entityType: params.get("entityType") || undefined,
      severity: (params.get("severity") || undefined) as AuditLogFilters["severity"],
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
    };
    return createBackendResponse(
      await getAuditService().listAuditLogs(
        filters,
        {
          page: Number(params.get("page") || 1),
          pageSize: Number(params.get("pageSize") || 100),
        },
        actorResult.data!
      ),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), requestContext.requestId);
  }
}
