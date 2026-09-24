import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getPaymentSettings } from "@/lib/api/paymentSettingsClient";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const repo = getPaymentRepository();
    const payment = await repo.findById(paymentId);
    
    if (!payment || payment.status !== "pending") {
      return NextResponse.json({ error: "Valid pending payment not found" }, { status: 404 });
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const options = {
      amount: Math.round(payment.amount * 100), // Server-verified amount
      currency: "INR",
      receipt: `rcpt_${paymentId.substring(0, 8)}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Bind the razorpay order id to our pending payment intent
    await repo.updateGatewayOrderId(paymentId, order.id, order.id);

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
