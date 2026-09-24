import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberId, amount, paymentMethod, category } = body;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Initialize Supabase and insert payment record
    const supabase = createSupabaseBackendClient();
    
    // In actual implementation, we might want to lookup the exact member name and details
    // For now, save the payment record directly 
    const { data: memberData } = await supabase
      .from("members")
      .select("full_name")
      .eq("id", memberId)
      .single();

    const insertData = {
      member_id: memberId,
      member_name: memberData?.full_name || "Unknown Member",
      amount: amount,
      payment_method: paymentMethod || "upi",
      status: "completed",
      reference_id: razorpay_payment_id,
      payment_date: new Date().toISOString(),
      category: category || "monthly_dues",
    };

    const { error: insertError } = await supabase.from("payments").insert(insertData);

    if (insertError) {
      console.error("Payment insert error:", insertError);
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
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
