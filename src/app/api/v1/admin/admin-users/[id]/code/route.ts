import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminUserService } from "@/lib/backend/composition/adminUserService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    const { id } = await routeContext.params;
    return createBackendResponse(await getAdminUserService().resetAdminCode(id, actor.data!), context.requestId);
  } catch { return createBackendResponse(fail(serverError()), context.requestId); }
}
