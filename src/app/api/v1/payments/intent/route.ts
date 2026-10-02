import { NextRequest } from "next/server";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { rateLimitError, serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { getPaymentService } from "@/lib/backend/composition/paymentService.server";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";
import { consumePublicRateLimit } from "@/lib/backend/security/publicRateLimit.server";
import { validatePhone } from "@/lib/backend/validation/commonSchemas";

export async function POST(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createBackendResponse(fail(validationError("Request body must be valid JSON.")), actor.requestId);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return createBackendResponse(
        fail(validationError("Payment details are required.")),
        actor.requestId
      );
    }
    const input = body as Record<string, unknown>;
    if (!input.payerPhone || !input.category || !input.method) {
      return createBackendResponse(
        fail(validationError("Payer phone, category and payment method are required.")),
        actor.requestId
      );
    }
    const validatedPhone = validatePhone(input.payerPhone, "payerPhone");
    if (!validatedPhone.ok) {
      return createBackendResponse(fail(validatedPhone.error!), actor.requestId);
    }
    const withinLimit = await consumePublicRateLimit("payment-intent", validatedPhone.data!, 8, 900);
    if (!withinLimit) {
      return createBackendResponse(fail(rateLimitError()), actor.requestId);
    }

    const result = await getPaymentService().createPaymentIntent(
      {
        memberQuery: input.memberQuery as string | undefined,
        payerName: input.payerName as string | undefined,
        payerPhone: input.payerPhone as string,
        category: input.category as "monthly_dues" | "special_event",
        method: input.method as "upi" | "qr_code" | "cash_handover" | "admin_cash_entry",
        selectedMonthIds: input.selectedMonthIds as string[] | undefined,
        tier: input.tier as "base" | "premium" | "custom" | "flexible" | undefined,
        customAmount: input.customAmount as number | undefined,
        eventId: input.eventId as string | undefined,
        receivedByAdminId: input.receivedByAdminId as string | undefined,
        notes: input.notes as string | undefined,
      },
      actor
    );

    if (result.ok && result.data && (result.data.method === "upi" || result.data.method === "qr_code")) {
      const receiptAccessToken = await getReceiptService().issuePublicAccessToken(result.data.paymentId);
      return createBackendResponse(
        { ...result, data: { ...result.data, receiptAccessToken } },
        actor.requestId
      );
    }

    return createBackendResponse(result, actor.requestId);
  } catch {
    return createBackendResponse(fail(serverError("Unable to start payment.")), actor.requestId);
  }
}
