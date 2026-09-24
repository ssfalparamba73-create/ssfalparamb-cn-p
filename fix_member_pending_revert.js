const fs = require('fs');
const file = 'src/app/member/payments/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldMapper = `  const transactions: Transaction[] = (payments?.items ?? []).map((payment) => {
    let uiStatus: "COMPLETED" | "FAILED" = "FAILED";
    if (payment.status === "confirmed") uiStatus = "COMPLETED";
    // Everything else (pending, failed, cancelled, rejected) maps to FAILED.
    // 'pending' simply means an abandoned checkout intent.

    return {
      id: payment.id,
      date: new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      amount: payment.amount,
      method: payment.method.toUpperCase().includes("CASH") ? "CASH" : "UPI",
      status: uiStatus,
      receiptUrl: payment.receiptUrl,
    };
  });`;

const newMapper = `  const transactions: Transaction[] = (payments?.items ?? []).map((payment) => ({
    id: payment.id,
    date: new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    amount: payment.amount,
    method: payment.method.toUpperCase().includes("CASH") ? "CASH" : "UPI",
    status: payment.status,
    receiptUrl: payment.receiptUrl,
  }));`;

if (content.includes(oldMapper)) {
  content = content.replace(oldMapper, newMapper);
  fs.writeFileSync(file, content);
  console.log('Restored member payments page');
} else {
  console.log('Could not find member mapper');
}
