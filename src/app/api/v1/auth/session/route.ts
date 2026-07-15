import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    return createBackendResponse(ok(actorResult.data!), actorResult.data!.requestId);
  } catch (err) {
    console.error(`[${publicActor.requestId}] Session resolve error`, err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}
