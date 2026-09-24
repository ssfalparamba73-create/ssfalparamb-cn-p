const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the handler — navigate immediately, verify in background
const oldHandler = `        handler: async function (response: any) {
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
              router.push("/success?paymentId=" + intent.paymentId);
            } else {
              setCashfreeError("Payment verification failed.");
            }
          } catch (err) {
            setCashfreeError("Payment verification failed.");
          }
        },`;

const newHandler = `        handler: async function (response: any) {
          // Navigate immediately — user sees skeleton receipt right away
          router.push("/success?paymentId=" + intent.paymentId);
          // Fire-and-forget: verify + receipt generation happens in background
          fetch("/api/v1/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: intent.paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })
          }).catch(() => {/* background — errors handled on success page */});
        },`;

content = content.replace(oldHandler, newHandler);
fs.writeFileSync(file, content);
