import { NextRequest } from "next/server";
import { createBackendResponse } from "../../../../../../lib/backend/http/backendResultResponse";
import { fail } from "../../../../../../lib/backend/errors/resultHelpers";
import { serverError, paymentError } from "../../../../../../lib/backend/errors/createBackendError";
import { getCashfreeService } from "../../../../../../lib/backend/composition/cashfreeService.server";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Must capture raw body string for Cashfree signature verification
    const rawBody = await request.text();
    
    // Extract headers
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      const errResult = fail(paymentError("Missing required Cashfree webhook headers"));
      return createBackendResponse(errResult, "webhook");
    }

    const cashfreeService = getCashfreeService();
    
    // Process webhook. The service handles signature validation with the raw string
    const result = await cashfreeService.handleWebhook(rawBody, signature, timestamp);

    return createBackendResponse(result, "webhook");
  } catch (err) {
    console.error(`[Webhook Error] Unhandled Cashfree webhook route error:`, err instanceof Error ? err.message : err);
    const errResult = fail(serverError("An internal server error occurred processing webhook."));
    return createBackendResponse(errResult, "webhook");
  }
}
