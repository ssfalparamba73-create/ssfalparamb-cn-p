import type { NextRequest } from "next/server";
import type { UpdateMemberInput } from "@/lib/backend/contracts/member.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminMemberService } from "@/lib/backend/composition/adminMemberService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

interface MemberRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: MemberRouteContext) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    const { id } = await context.params;
    return createBackendResponse(
      await getAdminMemberService().getMember(id, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}

export async function PATCH(request: NextRequest, context: MemberRouteContext) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    let input: UpdateMemberInput;
    try {
      input = (await request.json()) as UpdateMemberInput;
    } catch {
      return createBackendResponse(
        fail(validationError("Request body must be valid JSON.")),
        requestContext.requestId
      );
    }

    const { id } = await context.params;
    return createBackendResponse(
      await getAdminMemberService().updateMember(id, input, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}

export async function DELETE(request: NextRequest, context: MemberRouteContext) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    const { id } = await context.params;
    return createBackendResponse(
      await getAdminMemberService().softDeleteMember(id, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}
