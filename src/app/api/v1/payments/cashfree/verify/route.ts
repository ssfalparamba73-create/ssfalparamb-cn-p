import { NextRequest } from "next/server";
import { createBackendResponse } from "../../../../../../lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "../../../../../../lib/backend/http/requestContext";
import { fail } from "../../../../../../lib/backend/errors/resultHelpers";
import { validationError, serverError } from "../../../../../../lib/backend/errors/createBackendError";
import { getCashfreeService } from "../../../../../../lib/backend/composition/cashfreeService.server";

interface VerifyPaymentRequest {
  cfOrderId: string;
}

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  
  try {
    const body: VerifyPaymentRequest = await request.json();

    if (!body.cfOrderId) {
      const errResult = fail(validationError("Cashfree Order ID is required.", "cfOrderId"));
      return createBackendResponse(errResult, actor.requestId);
    }

    const cashfreeService = getCashfreeService();
    const result = await cashfreeService.verifyPayment(
      {
        cfOrderId: body.cfOrderId
      },
      actor
    );

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error(`[${actor.requestId}] Unhandled Cashfree verify route error:`, err instanceof Error ? err.message : err);
    const errResult = fail(serverError("An internal server error occurred."));
    return createBackendResponse(errResult, actor.requestId);
  }
}
