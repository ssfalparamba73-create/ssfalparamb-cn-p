import type { NextRequest } from "next/server";
import type { UpdateMemberProfileInput } from "@/lib/backend/contracts/member.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getMemberService } from "@/lib/backend/composition/memberService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);
    return createBackendResponse(
      await getMemberService().getCurrentMemberProfile(actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), requestContext.requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    let input: UpdateMemberProfileInput;
    try {
      input = (await request.json()) as UpdateMemberProfileInput;
    } catch {
      return createBackendResponse(
        fail(validationError("Request body must be valid JSON.")),
        requestContext.requestId
      );
    }

    return createBackendResponse(
      await getMemberService().updateProfile(input, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), requestContext.requestId);
  }
}
