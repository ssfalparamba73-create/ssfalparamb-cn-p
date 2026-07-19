import "server-only";
import type { NextRequest } from "next/server";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import { getAuthService } from "../composition/authService.server";
import { fail, ok } from "../errors/resultHelpers";
import { readSessionCookie } from "./sessionCookie";

export async function resolveAuthenticatedActor(
  request: NextRequest,
  requestId: string
): Promise<BackendResult<ActorContext>> {
  const rawToken = await readSessionCookie();
  const sessionResult = await getAuthService().getCurrentSession(rawToken ?? "");
  if (!sessionResult.ok) return fail(sessionResult.error!, { requestId });

  const session = sessionResult.data!;
  const actor: ActorContext = {
    actorType: session.actorType,
    actorName: session.actorName,
    requestId,
    device: request.headers.get("user-agent")?.slice(0, 200),
  };

  if (session.actorType === "member") actor.memberId = session.actorId;
  if (session.actorType === "admin") actor.adminId = session.actorId;

  return ok(actor, { requestId });
}
