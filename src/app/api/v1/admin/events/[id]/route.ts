import type { NextRequest } from "next/server";
import type { UpdateSpecialEventInput } from "@/lib/backend/contracts/event.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getEventService } from "@/lib/backend/composition/eventService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    let input: UpdateSpecialEventInput;
    try {
      input = (await request.json()) as UpdateSpecialEventInput;
    } catch {
      return createBackendResponse(fail(validationError("Request body must be valid JSON.")), context.requestId);
    }
    const { id } = await routeContext.params;
    return createBackendResponse(await getEventService().update(id, input, actor.data!), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function DELETE(request: NextRequest, routeContext: RouteContext) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    const { id } = await routeContext.params;
    return createBackendResponse(await getEventService().archive(id, actor.data!), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
