import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getAdminAuthService } from "@/lib/backend/composition/adminAuthService.server";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'admin') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    const service = getAdminAuthService();
    const result = await service.getCurrentAdmin(actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Admin session error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

