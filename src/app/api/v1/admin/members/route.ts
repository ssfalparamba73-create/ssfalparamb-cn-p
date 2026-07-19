import type { NextRequest } from "next/server";
import type { MemberListFilters } from "@/lib/backend/dto/member.dto";
import type { CreateMemberInput } from "@/lib/backend/contracts/member.contract";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminMemberService } from "@/lib/backend/composition/adminMemberService.server";
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
    const isBloodDonor = params.get("isBloodDonor");
    const donorAvailable = params.get("donorAvailable");
    if (isBloodDonor !== null && isBloodDonor !== "true" && isBloodDonor !== "false") {
      return createBackendResponse(
        fail(validationError("Invalid blood donor filter.", "isBloodDonor")),
        requestContext.requestId
      );
    }
    if (donorAvailable !== null && donorAvailable !== "true" && donorAvailable !== "false") {
      return createBackendResponse(
        fail(validationError("Invalid donor availability filter.", "donorAvailable")),
        requestContext.requestId
      );
    }
    const filters: MemberListFilters = {
      search: params.get("search") || undefined,
      status: (params.get("status") || undefined) as MemberListFilters["status"],
      bloodGroup: (params.get("bloodGroup") || undefined) as MemberListFilters["bloodGroup"],
      area: params.get("area") || undefined,
      monthlyTier: (params.get("monthlyTier") || undefined) as MemberListFilters["monthlyTier"],
      paymentStatus: (params.get("paymentStatus") || undefined) as MemberListFilters["paymentStatus"],
      isBloodDonor: isBloodDonor === null ? undefined : isBloodDonor === "true",
      donorAvailable: donorAvailable === null ? undefined : donorAvailable === "true",
    };
    const pagination = {
      page: Number(params.get("page") || 1),
      pageSize: Number(params.get("pageSize") || 20),
    };

    return createBackendResponse(
      await getAdminMemberService().listMembers(filters, pagination, actorResult.data!),
      requestContext.requestId
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}

export async function POST(request: NextRequest) {
  const requestContext = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, requestContext.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, requestContext.requestId);

    let input: CreateMemberInput;
    try {
      input = (await request.json()) as CreateMemberInput;
    } catch {
      return createBackendResponse(
        fail(validationError("Request body must be valid JSON.")),
        requestContext.requestId
      );
    }

    return createBackendResponse(
      await getAdminMemberService().createMember(input, actorResult.data!),
      requestContext.requestId,
      201
    );
  } catch {
    return createBackendResponse(
      fail(serverError(), { requestId: requestContext.requestId }),
      requestContext.requestId
    );
  }
}
