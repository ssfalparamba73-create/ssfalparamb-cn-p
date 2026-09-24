const fs = require('fs');

// 1. Fix supabasePaymentRepository.ts
const repoFile = 'src/lib/backend/adapters/supabase/repositories/supabasePaymentRepository.ts';
let repoContent = fs.readFileSync(repoFile, 'utf8');

const oldSettingFetch = `const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["monthly_due_base_amount", "monthly_due_premium_amount"]);
          const baseAmount = Number(settings?.find(s => s.key === "monthly_due_base_amount")?.value || 50);
          const premiumAmount = Number(settings?.find(s => s.key === "monthly_due_premium_amount")?.value || 100);`;

const newSettingFetch = `const { data: appSettings } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
          const baseAmount = Number(appSettings?.value?.baseTier || 50);
          const premiumAmount = Number(appSettings?.value?.premiumTier || 100);`;

repoContent = repoContent.replace(oldSettingFetch, newSettingFetch);
fs.writeFileSync(repoFile, repoContent);

// 2. Fix paymentService.server.ts
const compositionFile = 'src/lib/backend/composition/paymentService.server.ts';
let compContent = fs.readFileSync(compositionFile, 'utf8');

// I need to add createSupabaseBackendClient import and use it.
const compImports = `import "server-only";

import { createSupabaseBackendClient } from "../adapters/supabase/client";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";`;

const compFunctions = `export function getPaymentRepository() {
  return new SupabasePaymentRepository();
}

export function getPaymentService() {
  return createPaymentService({
    paymentRepository: getPaymentRepository(),
    getSpecialEventMinimumAmount: async () => {
      const supabase = createSupabaseBackendClient();
      const { data } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
      return Number(data?.value?.customMinimum || 30);
    },
    getCashEntryMinimumAmount: async () => 1,
  });
}`;

fs.writeFileSync(compositionFile, compImports + '\n\n' + compFunctions + '\n');
console.log('Fixed backend pricing sources');
