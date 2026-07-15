import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { MemberStatus } from "@/lib/backend/dto/member.dto";
import { serverError, authError, validationError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { MonthlyTier } from "@/lib/backend/dto/member.dto";
import { getAdminMemberService } from "@/lib/backend/composition/adminMemberService.server";

export async function GET(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'admin') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    const filters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as MemberStatus) || undefined,
      monthlyTier: (searchParams.get('monthlyTier') as MonthlyTier) || undefined
    };

    const service = getAdminMemberService();
    const result = await service.listMembers(filters, { page, pageSize }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] List members error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

export async function POST(req: NextRequest) {
  const publicActor = buildPublicActorContext(req);
  
  try {
    const actorResult = await resolveActor(req);

    if (!actorResult.ok) {
      return createBackendResponse(fail(actorResult.error!), publicActor.requestId);
    }

    const actor = actorResult.data!;
    if (actor.actorType !== 'admin') {
      return createBackendResponse(fail(authError("Unauthorized")), actor.requestId);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return createBackendResponse(fail(validationError("Invalid JSON body")), actor.requestId);
    }

    const service = getAdminMemberService();
    const result = await service.createMember(body, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] Create member error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}


