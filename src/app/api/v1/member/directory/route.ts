import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { BloodGroup } from "@/lib/backend/dto/member.dto";
import { serverError, authError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getMemberService } from "@/lib/backend/composition/memberService.server";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'member') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Read filters from query params
    const filters = {
      search: searchParams.get('search') || undefined,
      bloodGroup: (searchParams.get('bloodGroup') as BloodGroup) || undefined,
      isBloodDonor: searchParams.get('isBloodDonor') === 'true' ? true : undefined,
      area: searchParams.get('area') || undefined,
      occupation: searchParams.get('occupation') || undefined
    };

    const service = getMemberService();
    const result = await service.listDirectory(filters, { page, pageSize }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Directory error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

