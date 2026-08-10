import "server-only";

import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";

export function getPaymentService() {
  return createPaymentService({
    paymentRepository: new SupabasePaymentRepository(),
    // Keep this value aligned with the public payment form until the admin
    // dues settings are persisted in the backend.
    getSpecialEventMinimumAmount: async () => 30,
    getCashEntryMinimumAmount: async () => 1,
  });
}
