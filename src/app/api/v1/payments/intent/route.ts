import { NextRequest } from "next/server";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  try {
    const body = await request.json();
    if (!body?.payerPhone || !body?.category || !body?.method) {
      return createBackendResponse(
        fail(validationError("Payer phone, category and payment method are required.")),
        actor.requestId
      );
    }

    const result = await getPaymentService().createPaymentIntent(
      {
        memberQuery: body.memberQuery,
        payerName: body.payerName,
        payerPhone: body.payerPhone,
        category: body.category,
        method: body.method,
        selectedMonthIds: body.selectedMonthIds,
        tier: body.tier,
        customAmount: body.customAmount,
        eventId: body.eventId,
      },
      actor
    );
    return createBackendResponse(result, actor.requestId);
  } catch {
    return createBackendResponse(fail(serverError("Unable to start payment.")), actor.requestId);
  }
}
