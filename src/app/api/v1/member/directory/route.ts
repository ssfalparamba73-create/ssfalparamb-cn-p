import type { NextRequest } from "next/server";
import type { MemberListFilters } from "@/lib/backend/dto/member.dto";
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

    const params = request.nextUrl.searchParams;
    const donorAvailable = params.get("donorAvailable");
    if (donorAvailable !== null && donorAvailable !== "true" && donorAvailable !== "false") {
      return createBackendResponse(
        fail(validationError("Invalid donor availability filter.", "donorAvailable")),
        requestContext.requestId
      );
    }
    const filters: MemberListFilters = {
      search: params.get("search") || undefined,
      area: params.get("area") || undefined,
      bloodGroup: (params.get("bloodGroup") || undefined) as MemberListFilters["bloodGroup"],
      donorAvailable: donorAvailable === null ? undefined : donorAvailable === "true",
    };

    return createBackendResponse(
      await getMemberService().listDirectory(
        filters,
        {
          page: Number(params.get("page") || 1),
          pageSize: Number(params.get("pageSize") || 100),
        },
        actorResult.data!
      ),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), requestContext.requestId);
  }
}
