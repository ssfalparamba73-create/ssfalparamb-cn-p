const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace min="30" with min={paymentSettings.customMinimum}
content = content.replace(/min="30"/g, 'min={paymentSettings.customMinimum}');

// Replace finalAmount < 30 with finalAmount < paymentSettings.customMinimum
content = content.replace(/finalAmount < 30/g, 'finalAmount < paymentSettings.customMinimum');

// Also there might be an error message that says something like "Minimum 30"
content = content.replace(/Minimum ,130/g, 'Minimum ,1{paymentSettings.customMinimum}');
content = content.replace(/Minimum ₹30/g, 'Minimum ₹{paymentSettings.customMinimum}');

// Let's also check the isButtonDisabled logic
// Currently it might be checking finalAmount < 30
content = content.replace(/finalAmount < 30/g, 'finalAmount < paymentSettings.customMinimum'); // already done

// Let's find exactly what's inside the <p> error tag
const errorTagRegex = /<p className="text-xs text-red-500 font-medium flex items-center gap-1">\s*(.*?)\s*<\/p>/g;
content = content.replace(/Minimum amount is ₹30/g, 'Minimum amount is ₹{paymentSettings.customMinimum}');

fs.writeFileSync(file, content);
console.log('Fixed custom amount minimum');
