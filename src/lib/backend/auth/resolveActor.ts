import { NextRequest } from "next/server";
import { getSessionCookie } from "./sessionCookie";
import { getAuthService } from "../composition/authService.server";
import { ActorContext, BackendResult } from "../contracts/common.contract";
import { buildPublicActorContext } from "../http/requestContext";
import { ok, fail } from "../errors/resultHelpers";
import { ERROR_CODES } from "../errors/errorCodes";

export async function resolveActor(req: NextRequest): Promise<BackendResult<ActorContext>> {
  const token = await getSessionCookie();
  
  // If no token, default to a public actor context
  if (!token) {
    // Explicitly fail because they are trying to resolve an authenticated actor
    // The calling protected route expects an authenticated actor
    return fail({
      code: ERROR_CODES.LOGIN_REQUIRED,
      type: "auth",
      message: "No session found",
      retryable: false
    });
  }

  const authService = getAuthService();
  const result = await authService.getCurrentActor(token);
  
  if (!result.ok) {
    return fail(result.error!);
  }

  const publicContext = buildPublicActorContext(req);

  return ok({
    actorType: result.data!.actorType,
    memberId: result.data!.memberId,
    adminId: result.data!.adminId,
    actorName: result.data!.actorName,
    requestId: publicContext.requestId,
    ip: publicContext.ip,
    device: publicContext.device
  });
}
