const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCheckout = `    try {
      const orderRes = await fetch("/api/v1/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Atiyya Group",
        description: "Educational Subscription",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/v1/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: finalAmount,
                paymentMethod: "upi",
                category: activeTab === "event" ? "special_event" : "monthly_dues",
              })
            });
            if (verifyRes.ok) {
              window.location.href = "/success";
            } else {
              setCashfreeError("Payment verification failed.");
            }
          } catch (err) {
            setCashfreeError("Payment verification failed.");
          }
        },
        prefill: {
          contact: memberQuery,
        },
        theme: { color: "#0f172a" }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setCashfreeError(response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      setCashfreeError(err.message || "Something went wrong.");
    }`;

const newCheckout = `    try {
      // 1. Create intent
      const intent = await requestBackend<{ paymentId: string; amount: number }>("/api/v1/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          memberQuery,
          payerName: memberQuery,
          payerPhone: memberQuery,
          category: activeTab === "event" ? "special_event" : "monthly_dues",
          method: "upi",
          selectedMonthIds: activeTab === "subscriptions" ? selectedMonths : undefined,
          tier: activeTab === "subscriptions" ? (duesTier === 50 ? "base" : "premium") : "custom",
          customAmount: activeTab === "event" ? finalAmount : undefined,
        }),
      });

      // 2. Create Razorpay order mapping to intent
      const orderRes = await fetch("/api/v1/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: intent.amount, paymentId: intent.paymentId })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 3. Open modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Atiyya Group",
        description: "Educational Subscription",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/v1/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: intent.paymentId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            if (verifyRes.ok) {
              window.location.href = "/success?paymentId=" + intent.paymentId;
            } else {
              setCashfreeError("Payment verification failed.");
            }
          } catch (err) {
            setCashfreeError("Payment verification failed.");
          }
        },
        prefill: {
          contact: memberQuery,
        },
        theme: { color: "#0f172a" }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setCashfreeError(response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setCashfreeError(err.message || "Something went wrong.");
    }`;

content = content.replace(oldCheckout, newCheckout);

// Because I used requestBackend in the new code, I need to make sure it's imported.
if (!content.includes('import { requestBackend }')) {
  content = content.replace('import { useState, Suspense, useEffect } from "react"', 'import { useState, Suspense, useEffect } from "react"\nimport { requestBackend } from "@/lib/api/backendClient"');
}

fs.writeFileSync(file, content);
