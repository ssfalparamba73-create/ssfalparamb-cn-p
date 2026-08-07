import { NextRequest } from "next/server";
import { createBackendResponse } from "../../../../../../lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "../../../../../../lib/backend/http/requestContext";
import { fail } from "../../../../../../lib/backend/errors/resultHelpers";
import { validationError, serverError } from "../../../../../../lib/backend/errors/createBackendError";
import { getRazorpayService } from "../../../../../../lib/backend/composition/razorpayService.server";

interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentId: string;
}

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  
  try {
    const body: VerifyPaymentRequest = await request.json();

    // Validate required fields
    if (!body.razorpayOrderId) {
      const errResult = fail(validationError("Razorpay Order ID is required.", "razorpayOrderId"));
      return createBackendResponse(errResult, actor.requestId);
    }

    if (!body.razorpayPaymentId) {
      const errResult = fail(validationError("Razorpay Payment ID is required.", "razorpayPaymentId"));
      return createBackendResponse(errResult, actor.requestId);
    }

    if (!body.razorpaySignature) {
      const errResult = fail(validationError("Razorpay Signature is required.", "razorpaySignature"));
      return createBackendResponse(errResult, actor.requestId);
    }

    if (!body.paymentId) {
      const errResult = fail(validationError("Payment ID is required.", "paymentId"));
      return createBackendResponse(errResult, actor.requestId);
    }

    const razorpayService = getRazorpayService();
    const result = await razorpayService.verifyPayment(
      {
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
        paymentId: body.paymentId,
      },
      actor
    );

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    void err;
    console.error(`[${actor.requestId}] Unhandled Razorpay verify route error.`);
    const errResult = fail(serverError("An internal server error occurred."));
    return createBackendResponse(errResult, actor.requestId);
  }
}
