import { NextRequest } from "next/server";
import { createBackendResponse } from "../../../../../../lib/backend/http/backendResultResponse";
import { fail } from "../../../../../../lib/backend/errors/resultHelpers";
import { validationError, serverError } from "../../../../../../lib/backend/errors/createBackendError";
import { getRazorpayService } from "../../../../../../lib/backend/composition/razorpayService.server";

export async function POST(request: NextRequest) {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      const errResult = fail(validationError("Missing webhook signature.", "x-razorpay-signature"));
      return createBackendResponse(errResult, requestId);
    }

    const razorpayService = getRazorpayService();
    const result = await razorpayService.handleWebhook(body, signature);

    return createBackendResponse(result, requestId);
  } catch (err) {
    void err;
    console.error(`[${requestId}] Unhandled Razorpay webhook route error.`);
    const errResult = fail(serverError("An internal server error occurred."));
    return createBackendResponse(errResult, requestId);
  }
}
