import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    
    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    
    // We care about payment.captured or order.paid
    if (payload.event === "payment.captured" || payload.event === "payment.authorized" || payload.event === "order.paid") {
      let orderId = "";
      let paymentId = "";
      
      if (payload.event === "order.paid") {
        orderId = payload.payload.order.entity.id;
        paymentId = payload.payload.payment?.entity?.id || "";
      } else {
        orderId = payload.payload.payment.entity.order_id;
        paymentId = payload.payload.payment.entity.id;
      }

      if (orderId) {
        const repo = getPaymentRepository();
        // Look up our internal payment by the Razorpay order ID
        const payment = await repo.findByGatewayOrderId(orderId);
        
        if (payment && payment.status === "pending") {
          // Confirm payment
          await repo.confirmPayment(payment.id, paymentId, signature);
          
          // Generate receipt
          await getReceiptService().createForPayment(payment.id, { requestId: "razorpay-webhook", role: "system", actorType: "admin" } as any);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
