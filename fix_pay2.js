const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Script src="https:\/\/checkout.razorpay.com\/v1\/checkout.js" strategy="lazyOnload" \/>[\s\n]*<Suspense/g,
  '<>\n      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />\n      <Suspense'
);

content = content.replace(
  /<\/Suspense>[\s\n]*\)[\s\n]*\}/g,
  '</Suspense>\n    </>\n  )\n}'
);

fs.writeFileSync(file, content);
