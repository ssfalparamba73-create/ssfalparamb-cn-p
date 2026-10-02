import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";
import { getRazorpayConfig } from "@/lib/backend/config/razorpay.config";
import { rateLimitError } from "@/lib/backend/errors/createBackendError";
import { consumePublicRateLimit } from "@/lib/backend/security/publicRateLimit.server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sameOrderAmount(order: { amount?: string | number; currency?: string }, amount: number): boolean {
  return Number(order.amount) === amount && order.currency === "INR";
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const paymentId =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as { paymentId?: unknown }).paymentId
        : undefined;
    const expectedUpdatedAt =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as { paymentUpdatedAt?: unknown }).paymentUpdatedAt
        : undefined;

    if (
      typeof paymentId !== "string" || !UUID_PATTERN.test(paymentId) ||
      typeof expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(expectedUpdatedAt))
    ) {
      return NextResponse.json({ error: "A valid paymentId and payment version are required." }, { status: 400 });
    }
    const withinLimit = await consumePublicRateLimit("razorpay-order", paymentId, 12, 900);
    if (!withinLimit) {
      return NextResponse.json({ error: rateLimitError().message }, { status: 429 });
    }

    const repository = getPaymentRepository();
    const payment = await repository.findById(paymentId);
    if (!payment || payment.status !== "pending") {
      return NextResponse.json({ error: "Valid pending payment not found." }, { status: 404 });
    }
    if (payment.updatedAt !== expectedUpdatedAt) {
      return NextResponse.json({ error: "Payment details changed. Please restart checkout." }, { status: 409 });
    }
    if (payment.method !== "upi" && payment.method !== "qr_code") {
      return NextResponse.json({ error: "This payment method does not support Razorpay." }, { status: 409 });
    }
    if (payment.gatewayProvider && payment.gatewayProvider !== "razorpay") {
      return NextResponse.json({ error: "Payment is already assigned to another provider." }, { status: 409 });
    }

    const amount = Math.round(payment.amount * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Payment amount is invalid." }, { status: 409 });
    }

    const config = getRazorpayConfig();
    const razorpay = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });

    if (payment.gatewayOrderId) {
      const existingOrder = await razorpay.orders.fetch(payment.gatewayOrderId);
      if (
        existingOrder.id !== payment.gatewayOrderId ||
        !sameOrderAmount(existingOrder, amount)
      ) {
        return NextResponse.json({ error: "Stored Razorpay order does not match this payment." }, { status: 409 });
      }
      return NextResponse.json({
        id: existingOrder.id,
        amount: Number(existingOrder.amount),
        currency: existingOrder.currency,
        keyId: config.keyId,
      });
    }

    const createdOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: paymentId.replaceAll("-", ""),
      notes: { internal_payment_id: paymentId },
    });

    const claimed = await repository.setGatewayOrderIdIfUnset(paymentId, createdOrder.id, payment);
    if (!claimed) {
      const latest = await repository.findById(paymentId);
      if (
        latest?.status === "pending" &&
        latest.gatewayProvider === "razorpay" &&
        latest.gatewayOrderId &&
        latest.updatedAt === payment.updatedAt
      ) {
        const winningOrder = await razorpay.orders.fetch(latest.gatewayOrderId);
        if (
          winningOrder.id === latest.gatewayOrderId &&
          sameOrderAmount(winningOrder, Math.round(latest.amount * 100))
        ) {
          return NextResponse.json({
            id: winningOrder.id,
            amount: Number(winningOrder.amount),
            currency: winningOrder.currency,
            keyId: config.keyId,
          });
        }
      }
      return NextResponse.json({ error: "Payment changed while creating its Razorpay order." }, { status: 409 });
    }

    return NextResponse.json({
      id: createdOrder.id,
      amount: Number(createdOrder.amount),
      currency: createdOrder.currency,
      keyId: config.keyId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create Razorpay order." }, { status: 500 });
  }
}
