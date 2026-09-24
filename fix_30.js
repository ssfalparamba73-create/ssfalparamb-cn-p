const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace min="30" with min={paymentSettings.customMinimum}
content = content.replace(/min="30"/g, 'min={paymentSettings.customMinimum}');

// Replace finalAmount < 30 with finalAmount < paymentSettings.customMinimum
content = content.replace(/finalAmount < 30/g, 'finalAmount < paymentSettings.customMinimum');

// Replace the minimum amount text
content = content.replace(/Minimum amount is ,130/g, 'Minimum amount is ₹{paymentSettings.customMinimum}');
content = content.replace(/Minimum amount is ₹30/g, 'Minimum amount is ₹{paymentSettings.customMinimum}');

fs.writeFileSync(file, content);
console.log('Fixed custom amount logic');
