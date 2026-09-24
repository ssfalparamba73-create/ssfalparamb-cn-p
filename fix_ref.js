const fs = require('fs');

let file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the global one
content = content.replace(/const isUpiAvailable = paymentSettings\.upiEnabled \?\? true;\n\nfunction PayNowContent/g, 'function PayNowContent');

// Fix the useState for paymentMethod
content = content.replace(/const \[paymentMethod, setPaymentMethod\] = useState<"upi" \| "cash">\(.*?isUpiAvailable \? "upi" : "cash".*?\);/s, 'const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");');

fs.writeFileSync(file, content);
console.log('Fixed reference error');
