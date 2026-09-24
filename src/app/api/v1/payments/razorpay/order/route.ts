import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getPaymentSettings } from "@/lib/api/paymentSettingsClient";
import { getPaymentRepository } from "@/lib/backend/composition/paymentService.server";

export async function POST(req: Request) {
  try {
    const { amount, receipt, paymentId } = await req.json();

    if (!amount || !paymentId) {
      return NextResponse.json({ error: "Amount and paymentId are required" }, { status: 400 });
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: receipt || `rcpt_${paymentId.substring(0, 8)}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Bind the razorpay order id to our pending payment intent
    const repo = getPaymentRepository();
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
