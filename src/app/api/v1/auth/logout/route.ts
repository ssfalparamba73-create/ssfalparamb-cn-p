import { NextRequest } from "next/server";
import { getAuthService } from "@/lib/backend/composition/authService.server";
import { getSessionCookie, clearSessionCookie } from "@/lib/backend/auth/sessionCookie";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError } from "@/lib/backend/errors/createBackendError";

export async function POST(req: NextRequest) {
  const actor = buildPublicActorContext(req);
  
  try {
    const token = await getSessionCookie();
    
    if (token) {
      const authService = getAuthService();
      // We don't await strictly to prevent hanging on revoke if db is down, 
      // but await is better to know it's done. 
      await authService.logout(token).catch(e => {
        console.error(`[${actor.requestId}] Logout DB error`, e);
      });
    }

    await clearSessionCookie();

    return createBackendResponse(ok(undefined), actor.requestId);
  } catch (err) {
    console.error(`[${actor.requestId}] Logout error`, err);
    return createBackendResponse(fail(serverError("Internal server error")), actor.requestId);
  }
}
