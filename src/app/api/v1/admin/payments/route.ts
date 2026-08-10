import type { NextRequest } from "next/server";
import type { PaymentFilters } from "@/lib/backend/dto/payment.dto";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getAdminPaymentService } from "@/lib/backend/composition/adminPaymentService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
    const params = request.nextUrl.searchParams;
    const filters: PaymentFilters = {
      search: params.get("search") || undefined,
      category: (params.get("category") || undefined) as PaymentFilters["category"],
      method: (params.get("method") || undefined) as PaymentFilters["method"],
      status: (params.get("status") || undefined) as PaymentFilters["status"],
    };
    return createBackendResponse(
      await getAdminPaymentService().listPayments(filters, {
        page: Number(params.get("page") || 1),
        pageSize: Number(params.get("pageSize") || 100),
      }, actorResult.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
