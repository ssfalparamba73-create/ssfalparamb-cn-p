import type { NextRequest } from "next/server";
import type { MemberLoginInput } from "@/lib/backend/contracts/auth.contract";
import { getAuthService } from "@/lib/backend/composition/authService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { writeSessionCookie } from "@/lib/backend/auth/sessionCookie";

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);

  try {
    let body: Partial<MemberLoginInput>;
    try {
      body = (await request.json()) as Partial<MemberLoginInput>;
    } catch {
      return createBackendResponse(
        fail(validationError("Invalid JSON request body."), { requestId: actor.requestId }),
        actor.requestId
      );
    }

    const result = await getAuthService().loginMember(body as MemberLoginInput, actor);
    if (!result.ok) return createBackendResponse(result, actor.requestId);

    await writeSessionCookie(result.data!.rawToken);
    return createBackendResponse(
      ok(result.data!.session, { requestId: actor.requestId }),
      actor.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: actor.requestId }),
      actor.requestId
    );
  }
}
