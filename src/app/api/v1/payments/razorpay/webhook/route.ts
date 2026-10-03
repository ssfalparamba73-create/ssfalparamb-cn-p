import { NextRequest, NextResponse } from "next/server";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";
import { getRazorpayWebhookSecret } from "@/lib/backend/config/razorpay.config";
import { verifyRazorpaySignature } from "@/lib/backend/payments/razorpaySecurity";
import type { ActorContext } from "@/lib/backend/contracts/common.contract";

const systemActor: ActorContext = {
  actorType: "admin",
  requestId: "razorpay-webhook",
  permissions: ["payments.view"],
};

type RazorpayPaymentEntity = {
  id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const webhookSecret = getRazorpayWebhookSecret();
    if (!verifyRazorpaySignature(webhookSecret, rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }
    if (!isRecord(payload) || typeof payload.event !== "string" || !isRecord(payload.payload)) {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }

    // Authorization alone is not a completed payment. Razorpay's later captured
    // or order.paid event will perform the final ledger transition.
    if (payload.event === "payment.authorized") {
      return NextResponse.json({ status: "accepted", paymentStatus: "processing" });
    }
    if (payload.event !== "payment.captured" && payload.event !== "order.paid") {
      return NextResponse.json({ status: "ignored" });
    }

    const paymentContainer = payload.payload.payment;
    const paymentEntity = isRecord(paymentContainer) ? paymentContainer.entity : undefined;
    if (!isRecord(paymentEntity)) {
      return NextResponse.json({ error: "Captured payment details are missing." }, { status: 400 });
    }
    const providerPayment = paymentEntity as RazorpayPaymentEntity;

    let orderId: unknown = providerPayment.order_id;
    if (payload.event === "order.paid") {
      const orderContainer = payload.payload.order;
      const orderEntity = isRecord(orderContainer) ? orderContainer.entity : undefined;
      if (!isRecord(orderEntity) || typeof orderEntity.id !== "string") {
        return NextResponse.json({ error: "Paid order details are missing." }, { status: 400 });
      }
      if (orderId !== undefined && orderId !== orderEntity.id) {
        return NextResponse.json({ error: "Payment and order identifiers do not match." }, { status: 400 });
      }
      orderId = orderEntity.id;
    }

    if (
      typeof orderId !== "string" ||
      typeof providerPayment.id !== "string" ||
      !Number.isSafeInteger(providerPayment.amount) ||
      providerPayment.currency !== "INR" ||
      providerPayment.status !== "captured"
    ) {
      return NextResponse.json({ error: "Captured payment data is invalid." }, { status: 400 });
    }

    const payment = await getPaymentRepository().findByGatewayOrderId(orderId);
    if (!payment) return NextResponse.json({ status: "ignored" });

    const confirmed = await getPaymentRepository().confirmGatewayPayment({
      paymentId: payment.id,
      gatewayOrderId: orderId,
      gatewayPaymentId: providerPayment.id,
      amountMinor: providerPayment.amount as number,
      currency: providerPayment.currency,
    });
    await getReceiptService().createForPayment(confirmed.id, systemActor);

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
