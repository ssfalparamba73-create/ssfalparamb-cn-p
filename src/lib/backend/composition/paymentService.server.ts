import "server-only";

import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";

export function getPaymentRepository() {
  return new SupabasePaymentRepository();
}

export function getPaymentService() {
  return createPaymentService({
    paymentRepository: getPaymentRepository(),
    // Keep this value aligned with the public payment form until the admin
    // subscriptions settings are persisted in the backend.
    getSpecialEventMinimumAmount: async () => 30,
    getCashEntryMinimumAmount: async () => 1,
  });
}
