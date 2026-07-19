import type { NextRequest } from "next/server";
import type { CreateSupportContactInput } from "@/lib/backend/contracts/support.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getSupportService } from "@/lib/backend/composition/supportService.server";
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
      await getSupportService().listAdminContacts(actor.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    let input: CreateSupportContactInput;
    try {
      input = (await request.json()) as CreateSupportContactInput;
    } catch {
      return createBackendResponse(fail(validationError("Request body must be valid JSON.")), context.requestId);
    }
    return createBackendResponse(
      await getSupportService().createContact(input, actor.data!),
      context.requestId,
      201
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
