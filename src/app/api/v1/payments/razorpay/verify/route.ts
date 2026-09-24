import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    
    if (!paymentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required verification fields" }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Update payment record as confirmed
    const repo = getPaymentRepository();
    const payment = await repo.findById(paymentId);
    
    if (payment && payment.status === "pending") {
      await repo.confirmPayment(paymentId, razorpay_payment_id, razorpay_signature);
      
      // Generate the receipt immediately so frontend can fetch it right away
      await getReceiptService().createForPayment(paymentId, { requestId: "verify-endpoint", role: "system", actorType: "admin" } as any);
    }

    // Success response
    return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
