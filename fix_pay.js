const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldEnd = `export default function PayNowPage() {
  return (
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Suspense fallback={<div className="min-h-screen bg-secondary/50 flex items-center justify-center p-4"><p className="text-muted-foreground font-medium animate-pulse">Loading payment details...</p></div>}>
      <PayNowContent />
    </Suspense>
  )
}`;

const newEnd = `export default function PayNowPage() {
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Suspense fallback={<div className="min-h-screen bg-secondary/50 flex items-center justify-center p-4"><p className="text-muted-foreground font-medium animate-pulse">Loading payment details...</p></div>}>
        <PayNowContent />
      </Suspense>
    </>
  )
}`;

content = content.replace(oldEnd, newEnd);
fs.writeFileSync(file, content);
