import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { authError, serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getAdminMemberService } from "@/lib/backend/composition/adminMemberService.server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicActor = buildPublicActorContext(req);

  try {
    const actorResult = await resolveActor(req);
    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== "admin") {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createBackendResponse(fail(validationError("Invalid JSON body")), actor.requestId);
    }

    const result = await getAdminMemberService().resetMemberPin(id, body as { pin: string; forceReset?: boolean }, actor);
    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error(`[${publicActor.requestId}] Reset member PIN error`, err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}
