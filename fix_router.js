const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import useRouter
if (!content.includes('useRouter')) {
  content = content.replace('import { useSearchParams } from "next/navigation"', 'import { useSearchParams, useRouter } from "next/navigation"');
}

// Add useRouter hook inside component
if (!content.includes('const router = useRouter()')) {
  content = content.replace('const searchParams = useSearchParams();', 'const searchParams = useSearchParams();\n  const router = useRouter();');
}

// Replace window.location.href with router.push for Razorpay
content = content.replace('window.location.href = "/success?paymentId=" + intent.paymentId;', 'router.push("/success?paymentId=" + intent.paymentId);');

// Replace window.location.href for cash handover
content = content.replace(/window\.location\.href = `\/success\?method=cash_handover(.*?)\`;/, 'router.push(`/success?method=cash_handover$1`);');

fs.writeFileSync(file, content);
