import { NextRequest } from "next/server";
import { getAuthService } from "@/lib/backend/composition/authService.server";
import { setSessionCookie } from "@/lib/backend/auth/sessionCookie";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";

export async function POST(req: NextRequest) {
  const actor = buildPublicActorContext(req);
  
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.phone !== 'string' || typeof body.pin !== 'string') {
      return createBackendResponse(fail(validationError("Invalid payload")), actor.requestId);
    }

    const authService = getAuthService();
    const result = await authService.loginMember(body.phone, body.pin, actor.ip, actor.device);

    if (!result.ok) {
      // Do not return token or session, just error
      return createBackendResponse(fail(result.error!), actor.requestId);
    }

    // Set cookie
    await setSessionCookie(result.data!.rawToken, new Date(result.data!.session.expiresAt));

    // Return session safely (rawToken is excluded)
    return createBackendResponse(ok(result.data!.session), actor.requestId);
  } catch (err) {
    console.error(`[${actor.requestId}] Member login error`, err);
    return createBackendResponse(fail(serverError("Internal server error")), actor.requestId);
  }
}
