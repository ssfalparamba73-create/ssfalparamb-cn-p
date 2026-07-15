import "server-only";

import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createPaymentService } from "../services/paymentService";
import { PaymentService } from "../contracts/payment.contract";

let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    const paymentRepo = new SupabasePaymentRepository();
    paymentServiceInstance = createPaymentService({ 
      paymentRepository: paymentRepo,
      getSpecialEventMinimumAmount: async () => 0,
      getCashEntryMinimumAmount: async () => 0
    });
  }
  return paymentServiceInstance;
}

