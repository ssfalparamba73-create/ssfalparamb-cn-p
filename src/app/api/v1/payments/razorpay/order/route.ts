import { NextRequest } from "next/server";
import { createBackendResponse } from "../../../../../../lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "../../../../../../lib/backend/http/requestContext";
import { fail } from "../../../../../../lib/backend/errors/resultHelpers";
import { validationError, serverError } from "../../../../../../lib/backend/errors/createBackendError";
import { getRazorpayService } from "../../../../../../lib/backend/composition/razorpayService.server";

interface CreateOrderRequest {
  paymentId: string;
  amount?: number;
  currency?: string;
}

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!body.paymentId) {
      const errResult = fail(validationError("Payment ID is required.", "paymentId"));
      return createBackendResponse(errResult, actor.requestId);
    }

    const razorpayService = getRazorpayService();
    const result = await razorpayService.createOrder(
      {
        paymentId: body.paymentId,
        amount: body.amount,
        currency: body.currency,
      },
      actor
    );

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    console.error(`[${actor.requestId}] Unhandled Razorpay order route error:`, err instanceof Error ? err.message : err);
    const errResult = fail(serverError("An internal server error occurred."));
    return createBackendResponse(errResult, actor.requestId);
  }
}
