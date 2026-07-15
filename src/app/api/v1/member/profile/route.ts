import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, authError, validationError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getMemberService } from "@/lib/backend/composition/memberService.server";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'member') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    const service = getMemberService();
    const result = await service.getCurrentMemberProfile(actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Profile GET error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

export async function PATCH(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'member') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return createBackendResponse(fail(validationError("Invalid JSON body")), actor.requestId);
    }

    const service = getMemberService();
    const result = await service.updateProfile(body, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Profile PATCH error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}
