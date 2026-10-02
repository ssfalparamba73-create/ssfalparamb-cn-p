import "server-only";

import { createSupabaseBackendClient } from "../adapters/supabase/client";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";
import { isDuesFrequency } from "@/lib/payments/duesPeriod";

export function getPaymentRepository() {
  return new SupabasePaymentRepository();
}

export function getPaymentService() {
  return createPaymentService({
    paymentRepository: getPaymentRepository(),
    getPublicPaymentPolicy: async () => {
      const supabase = createSupabaseBackendClient();
      const { data, error } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
      if (error) throw error;

      const settings = data?.value as Record<string, unknown> | null;
      const configuredMinimum = Number(settings?.customMinimum ?? 10);
      return {
        customMinimum: Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 10,
        duesFrequency: isDuesFrequency(settings?.duesFrequency) ? settings.duesFrequency : "monthly",
        specialEventEnabled: settings?.specialEventEnabled === true,
        upiEnabled: settings?.upiEnabled !== false,
      };
    },
    getCashEntryMinimumAmount: async () => 1,
  });
}
