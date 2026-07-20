import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminMemberService } from "@/lib/backend/composition/adminMemberService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

interface MemberInvitationRouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: MemberInvitationRouteContext) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    const { id } = await context.params;
    return createBackendResponse(
      await getAdminMemberService().prepareMemberInvitation(id, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}
