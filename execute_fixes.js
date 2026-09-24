const fs = require('fs');

// 1. F1: Fix Backend Amount Resolution (supabasePaymentRepository.ts)
// 2. F2: Fix gateway_provider = "razorpay" (supabasePaymentRepository.ts)
const repoFile = 'src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts';
let repoContent = fs.readFileSync(repoFile, 'utf8');

// Replace settings fetch with app_settings fetch
const oldSettingFetch = `const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["monthly_due_base_amount", "monthly_due_premium_amount"]);
          const baseAmount = Number(settings?.find(s => s.key === "monthly_due_base_amount")?.value || 50);
          const premiumAmount = Number(settings?.find(s => s.key === "monthly_due_premium_amount")?.value || 100);`;
const newSettingFetch = `const { data: appSettings } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
          const baseAmount = Number((appSettings?.value as any)?.baseTier || 50);
          const premiumAmount = Number((appSettings?.value as any)?.premiumTier || 100);`;

// Just in case spacing is different, let's use regex
repoContent = repoContent.replace(/const \{ data: settings \} = await supabase\.from\("settings"\)[\s\S]*?\|\| 100\);/m, newSettingFetch);

// Replace gateway_provider
repoContent = repoContent.replace(/gateway_provider: "cashfree"/g, 'gateway_provider: "razorpay"');

fs.writeFileSync(repoFile, repoContent);
console.log('Fixed supabasePaymentRepository.ts');

// 3. F4: Fix customMinimum fallback (paymentService.server.ts)
const serverFile = 'src/lib/backend/composition/paymentService.server.ts';
let serverContent = fs.readFileSync(serverFile, 'utf8');
serverContent = serverContent.replace(/customMinimum \|\| 30/g, 'customMinimum || 10');
fs.writeFileSync(serverFile, serverContent);
console.log('Fixed paymentService.server.ts');

// 4. F6: Rename cashfreeError to paymentError (pay/page.tsx)
const pageFile = 'src/app/pay/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');
pageContent = pageContent.replace(/cashfreeError/g, 'paymentError');
pageContent = pageContent.replace(/setCashfreeError/g, 'setPaymentError');
fs.writeFileSync(pageFile, pageContent);
console.log('Fixed pay/page.tsx');

// 5. F7: Delete dead files
const deadFiles = [
  'src/lib/hooks/useCashfreeCheckout.ts',
  'src/lib/backend/services/cashfreeService.ts',
  'src/lib/backend/composition/cashfreeService.server.ts'
];
deadFiles.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Deleted ' + f);
  }
});
