const fs = require('fs');
let file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const isUpiAvailable = paymentSettings\.upiEnabled \?\? true;\s+function PayNowContent\(\) \{/, 'function PayNowContent() {');

fs.writeFileSync(file, content);
console.log('Fixed reference error for good');
