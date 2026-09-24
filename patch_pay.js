const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ useCashfreeCheckout \} from "@\/lib\/hooks\/useCashfreeCheckout"\n?/, '');
content = content.replace(/const \{ initiateCheckout, isProcessing, error: cashfreeError, clearError: clearCashfreeError \} = useCashfreeCheckout\(\);\n?/, 'const [isProcessing, setIsProcessing] = useState(false);\n  const [cashfreeError, setCashfreeError] = useState<string | null>(null);\n');

content = content.replace(/handleCashfreeCheckout/g, 'handleRazorpayCheckout');

// Find the handleRazorpayCheckout method and replace it entirely
const replaceCheckout = `const handleRazorpayCheckout = async () => {
    if (isButtonDisabled) {
      setCheckoutHint("Enter your phone number or member ID above to continue with Digital Payment.");
      return;
    }
    setCheckoutHint(null);
    setIsProcessing(true);
    setCashfreeError(null);

    try {
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
    } finally {
      setIsProcessing(false);
    }
  };`;

content = content.replace(/const handleRazorpayCheckout = async \(\) => \{[\s\S]*?(?=\s+const handleCashHandover)/, replaceCheckout + '\n\n');

// Add razorpay script
content = content.replace(/export default function PayNowPage\(\) \{/, `import Script from "next/script";\n\nexport default function PayNowPage() {`);
content = content.replace(/<Suspense fallback=/, `<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />\n      <Suspense fallback=`);

fs.writeFileSync(file, content);
