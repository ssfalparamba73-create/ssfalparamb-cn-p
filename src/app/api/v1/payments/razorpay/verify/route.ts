import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";
import { getRazorpayConfig } from "@/lib/backend/config/razorpay.config";
import { verifyRazorpaySignature } from "@/lib/backend/payments/razorpaySecurity";
import type { ActorContext } from "@/lib/backend/contracts/common.contract";
import { consumePublicRateLimit } from "@/lib/backend/security/publicRateLimit.server";
import { rateLimitError } from "@/lib/backend/errors/createBackendError";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const systemActor: ActorContext = {
  actorType: "admin",
  requestId: "razorpay-verify",
  permissions: ["payments.view"],
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
    }

    const {
      paymentId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentProviderId,
      razorpay_signature: signature,
    } = body as Record<string, unknown>;

    if (
      typeof paymentId !== "string" || !UUID_PATTERN.test(paymentId) ||
      typeof orderId !== "string" || orderId.length > 128 ||
      typeof paymentProviderId !== "string" || paymentProviderId.length > 128 ||
      typeof signature !== "string"
    ) {
      return NextResponse.json({ error: "Missing or invalid payment verification fields." }, { status: 400 });
    }

    const config = getRazorpayConfig();
    if (!verifyRazorpaySignature(config.keySecret, `${orderId}|${paymentProviderId}`, signature)) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }
    const withinLimit = await consumePublicRateLimit("razorpay-verify", paymentId, 30, 900);
    if (!withinLimit) {
      return NextResponse.json({ error: rateLimitError().message }, { status: 429 });
    }

    const razorpay = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
    const providerPayment = await razorpay.payments.fetch(paymentProviderId);
    if (providerPayment.order_id !== orderId) {
      return NextResponse.json({ error: "Provider payment does not belong to this order." }, { status: 400 });
    }
    if (providerPayment.status !== "captured") {
      if (providerPayment.status === "authorized") {
        return NextResponse.json(
          { success: false, status: "processing", message: "Payment is awaiting final confirmation." },
          { status: 202 }
        );
      }
      return NextResponse.json({ error: "Provider payment is not captured." }, { status: 409 });
    }
    const providerAmountMinor = Number(providerPayment.amount);
    if (providerPayment.currency !== "INR" || !Number.isSafeInteger(providerAmountMinor)) {
      return NextResponse.json({ error: "Provider payment amount or currency is invalid." }, { status: 409 });
    }

    const payment = await getPaymentRepository().confirmGatewayPayment({
      paymentId,
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentProviderId,
      gatewaySignature: signature,
      amountMinor: providerAmountMinor,
      currency: providerPayment.currency,
    });

    await getReceiptService().createForPayment(payment.id, systemActor);
    return NextResponse.json({ success: true, receiptId: payment.receiptId });
  } catch {
    return NextResponse.json({ error: "Payment verification could not be completed." }, { status: 500 });
  }
}
