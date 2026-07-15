import { NextRequest } from "next/server";
import { resolveActor } from "@/lib/backend/auth/resolveActor";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { PaymentMethod, PaymentStatus, PaymentCategory } from "@/lib/backend/dto/payment.dto";
import { serverError, authError } from "@/lib/backend/errors/createBackendError";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { getAdminPaymentService } from "@/lib/backend/composition/adminPaymentService.server";

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
      status: (searchParams.get('status') as PaymentStatus) || undefined,
      method: (searchParams.get('method') as PaymentMethod) || undefined,
      type: (searchParams.get('type') as PaymentCategory) || undefined,
      search: searchParams.get('search') || undefined,
      dateRange: {
        from: searchParams.get('dateFrom') || undefined,
        to: searchParams.get('dateTo') || undefined
      }
    };

    const service = getAdminPaymentService();
    const result = await service.listPayments(filters, { page, pageSize }, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error("[${publicActor.requestId}] List payments error", err);
    return createBackendResponse(fail(serverError("Internal server error")), publicActor.requestId);
  }
}

