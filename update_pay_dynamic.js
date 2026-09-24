const fs = require('fs');
const file = 'src/app/pay/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change State from 50 | 100 to number
const stateRegex = /const \[duesTier, setDuesTier\] = useState<50 \| 100>\(50\);/;
content = content.replace(stateRegex, `const [paymentSettings, setPaymentSettings] = useState({ baseTier: 50, premiumTier: 100, customMinimum: 10 });
  const [duesTier, setDuesTier] = useState<number>(50);

  // Fetch dynamic payment settings from admin panel configuration
  useEffect(() => {
    fetch("/api/v1/settings/payments")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setPaymentSettings(data.data);
          // Only update duesTier to the new base if they haven't manually changed it, 
          // or if they are currently on the old default '50'
          setDuesTier((prev) => (prev === 50 ? data.data.baseTier : prev));
        }
      })
      .catch(() => {});
  }, []);`);

// 2. Fix the tier checking logic in both razorpay order and cash handover
// Instead of (duesTier === 50), use (duesTier === paymentSettings.baseTier)
content = content.replace(/tier: activeTab === "subscriptions" \? \(duesTier === 50 \? "base" : "premium"\) : "custom",/g, 
  `tier: activeTab === "subscriptions" ? (duesTier === paymentSettings.baseTier ? "base" : "premium") : "custom",`);

// 3. Fix the UI buttons for Base Tier and Premium Tier
// Base Tier replacement
content = content.replace(/<button type="button" onClick=\{\(\) => setDuesTier\(50\)\} className=\{`p-3 rounded-xl border flex flex-col items-center justify-center gap-0\.5 transition-all \$\{duesTier === 50 \?/g,
  `<button type="button" onClick={() => setDuesTier(paymentSettings.baseTier)} className={\`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all \${duesTier === paymentSettings.baseTier ?`);
content = content.replace(/<span className="font-bold text-lg leading-none">₹50<\/span>/g,
  `<span className="font-bold text-lg leading-none">₹{paymentSettings.baseTier}</span>`);

// Premium Tier replacement
content = content.replace(/<button type="button" onClick=\{\(\) => setDuesTier\(100\)\} className=\{`p-3 rounded-xl border flex flex-col items-center justify-center gap-0\.5 transition-all \$\{duesTier === 100 \?/g,
  `<button type="button" onClick={() => setDuesTier(paymentSettings.premiumTier)} className={\`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all \${duesTier === paymentSettings.premiumTier ?`);
content = content.replace(/<span className="font-bold text-lg leading-none">₹100<\/span>/g,
  `<span className="font-bold text-lg leading-none">₹{paymentSettings.premiumTier}</span>`);

// 4. Update the Scan & Pay modal QR static amounts (if they exist)
content = content.replace(/<p className="text-xs font-semibold text-slate-500 mb-2">Scan & Pay ₹100<\/p>/g,
  `<p className="text-xs font-semibold text-slate-500 mb-2">Scan & Pay ₹{finalAmount || 0}</p>`);
content = content.replace(/<span className="text-xl font-bold text-slate-900">₹100\.00<\/span>/g,
  `<span className="text-xl font-bold text-slate-900">₹{finalAmount || 0}.00</span>`);

fs.writeFileSync(file, content);
console.log('Updated pay page with dynamic settings');
