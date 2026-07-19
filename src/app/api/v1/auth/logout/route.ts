import type { NextRequest } from "next/server";
import { clearSessionCookie, readSessionCookie } from "@/lib/backend/auth/sessionCookie";
import { getAuthService } from "@/lib/backend/composition/authService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);

  try {
    const rawToken = await readSessionCookie();
    const result = await getAuthService().logout(rawToken ?? "");
    await clearSessionCookie();
    return createBackendResponse(result, actor.requestId);
  } catch {
    await clearSessionCookie();
    return createBackendResponse(
      fail(serverError(), { requestId: actor.requestId }),
      actor.requestId
    );
  }
}
