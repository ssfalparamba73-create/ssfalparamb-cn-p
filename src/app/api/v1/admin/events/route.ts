import type { NextRequest } from "next/server";
import type { CreateSpecialEventInput } from "@/lib/backend/contracts/event.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getEventService } from "@/lib/backend/composition/eventService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    return createBackendResponse(await getEventService().list(actor.data!), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    let input: CreateSpecialEventInput;
    try {
      input = (await request.json()) as CreateSpecialEventInput;
    } catch {
      return createBackendResponse(fail(validationError("Request body must be valid JSON.")), context.requestId);
    }
    return createBackendResponse(await getEventService().create(input, actor.data!), context.requestId, 201);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
