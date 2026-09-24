const fs = require('fs');

const routeFile = 'src/app/api/v1/payments/razorpay/order/route.ts';
let routeContent = fs.readFileSync(routeFile, 'utf8');

const oldLogic = `const { amount, receipt, paymentId } = await req.json();

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
      receipt: receipt || \`rcpt_\${paymentId.substring(0, 8)}\`,
    };

    const order = await razorpay.orders.create(options);
    
    // Bind the razorpay order id to our pending payment intent
    const repo = getPaymentRepository();
    await repo.updateGatewayOrderId(paymentId, order.id, order.id);`;

const newLogic = `const { paymentId } = await req.json();

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
      receipt: \`rcpt_\${paymentId.substring(0, 8)}\`,
    };

    const order = await razorpay.orders.create(options);
    
    // Bind the razorpay order id to our pending payment intent
    await repo.updateGatewayOrderId(paymentId, order.id, order.id);`;

routeContent = routeContent.replace(oldLogic, newLogic);
fs.writeFileSync(routeFile, routeContent);

// And update the frontend to not send the amount
const pageFile = 'src/app/pay/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');
pageContent = pageContent.replace(/body: JSON\.stringify\(\{ amount: intent\.amount, paymentId: intent\.paymentId \}\)/g, 'body: JSON.stringify({ paymentId: intent.paymentId })');
fs.writeFileSync(pageFile, pageContent);

console.log('Fixed Razorpay order tamper-proofing');
