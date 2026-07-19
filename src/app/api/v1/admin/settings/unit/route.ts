import type { NextRequest } from "next/server";
import type { UpdateUnitSettingsInput } from "@/lib/backend/contracts/unitSettings.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getUnitSettingsService } from "@/lib/backend/composition/unitSettingsService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    return createBackendResponse(
      await getUnitSettingsService().getUnitSettings(actor.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    let input: UpdateUnitSettingsInput;
    try {
      input = (await request.json()) as UpdateUnitSettingsInput;
    } catch {
      return createBackendResponse(fail(validationError("Request body must be valid JSON.")), context.requestId);
    }
    return createBackendResponse(
      await getUnitSettingsService().updateUnitSettings(input, actor.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
