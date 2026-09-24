const fs = require('fs');

let file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace hardcoded isUpiAvailable
content = content.replace(/const isUpiAvailable = true;/g, 'const isUpiAvailable = paymentSettings.upiEnabled ?? true;');

// Replace hardcoded isSpecialEventActive
content = content.replace(/const isSpecialEventActive = true;/g, 'const isSpecialEventActive = paymentSettings.specialEventEnabled ?? false;');

// Need to define it AFTER paymentSettings is available, or pull it inside PayNowContent component.
// Wait, isUpiAvailable was defined outside PayNowContent?
// Let's look at `cat src/app/pay/page.tsx | Select-String -Pattern "isUpiAvailable"` output:
// const isUpiAvailable = true;
// function PayNowContent() {

// Ah, it was outside! We need to move it inside `PayNowContent` and use `paymentSettings`.

content = content.replace(/const isUpiAvailable = true;\s*function PayNowContent\(\) \{/g, 'function PayNowContent() {');

// The `isSpecialEventActive` was already inside, so the replacement above will just replace `const isSpecialEventActive = true;` with `const isSpecialEventActive = paymentSettings.specialEventEnabled ?? false;`

// Since we moved isUpiAvailable inside, we need to put it near `paymentSettings`.
// Let's find `const [paymentSettings, setPaymentSettings] = useState({ ... });`
content = content.replace(/const \[paymentSettings, setPaymentSettings\] = useState\(\{ baseTier: 50, premiumTier: 100, customMinimum: 10 \}\);/g, `const [paymentSettings, setPaymentSettings] = useState({ baseTier: 50, premiumTier: 100, customMinimum: 10, upiEnabled: true, specialEventEnabled: false });\n  const isUpiAvailable = paymentSettings.upiEnabled ?? true;`);

// Since `useState(isUpiAvailable ? "upi" : "cash")` was initialized BEFORE `paymentSettings` is loaded, 
// if upiEnabled is loaded from API as false, we need to switch to cash.
// So let's add a useEffect to handle this.
const effect = `
  useEffect(() => {
    if (!isUpiAvailable && paymentMethod === "upi") {
      setPaymentMethod("cash");
    }
  }, [isUpiAvailable, paymentMethod]);
`;
content = content.replace(/const \[checkoutHint, setCheckoutHint\] = useState<string \| null>\(null\);/g, `const [checkoutHint, setCheckoutHint] = useState<string | null>(null);\n${effect}`);

// And wait, if `activeTab` is "event" but `specialEventEnabled` is false, switch to "subscriptions"
const effect2 = `
  useEffect(() => {
    if (!isSpecialEventActive && activeTab === "event") {
      setActiveTab("subscriptions");
    }
  }, [isSpecialEventActive, activeTab]);
`;
content = content.replace(/const currentContributionPeriod/g, `${effect2}\n  const currentContributionPeriod`);

fs.writeFileSync(file, content);
console.log('Fixed pay/page.tsx toggles');
