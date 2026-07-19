import type { NextRequest } from "next/server";
import { readSessionCookie, writeSessionCookie } from "@/lib/backend/auth/sessionCookie";
import { getAuthService } from "@/lib/backend/composition/authService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const actor = buildPublicActorContext(request);

  try {
    const rawToken = await readSessionCookie();
    const result = await getAuthService().getCurrentSession(rawToken ?? "");
    if (!result.ok) return createBackendResponse(result, actor.requestId);

    await writeSessionCookie(rawToken!);
    return createBackendResponse(
      ok(result.data!, { requestId: actor.requestId }),
      actor.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: actor.requestId }),
      actor.requestId
    );
  }
}
