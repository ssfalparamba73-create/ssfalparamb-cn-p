import "server-only";

import { createSupabaseBackendClient } from "../adapters/supabase/client";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";

export function getPaymentRepository() {
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
}
