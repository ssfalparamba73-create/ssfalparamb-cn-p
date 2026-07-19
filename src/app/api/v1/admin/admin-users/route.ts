import type { NextRequest } from "next/server";
import type { AdminUserFilters, PromoteMemberToAdminInput } from "@/lib/backend/contracts/admin.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminUserService } from "@/lib/backend/composition/adminUserService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    const params = request.nextUrl.searchParams;
    const filters: AdminUserFilters = {
      search: params.get("search") || undefined,
      role: params.get("role") || undefined,
      status: (params.get("status") || undefined) as AdminUserFilters["status"],
    };
    return createBackendResponse(await getAdminUserService().listAdmins(filters, {
      page: Number(params.get("page") || 1),
      pageSize: Number(params.get("pageSize") || 100),
    }, actor.data!), context.requestId);
  } catch { return createBackendResponse(fail(serverError()), context.requestId); }
}

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    let input: PromoteMemberToAdminInput;
    try { input = (await request.json()) as PromoteMemberToAdminInput; }
    catch { return createBackendResponse(fail(validationError("Request body must be valid JSON.")), context.requestId); }
    return createBackendResponse(await getAdminUserService().promoteMember(input, actor.data!), context.requestId, 201);
  } catch { return createBackendResponse(fail(serverError()), context.requestId); }
}
