import "server-only";

import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createAdminPaymentService } from "../services/adminPaymentService";
import { AdminPaymentService } from "../contracts/payment.contract";

let adminPaymentServiceInstance: AdminPaymentService | null = null;

export function getAdminPaymentService(): AdminPaymentService {
  if (!adminPaymentServiceInstance) {
    const paymentRepo = new SupabasePaymentRepository();
    adminPaymentServiceInstance = createAdminPaymentService({ paymentRepository: paymentRepo });
  }
  return adminPaymentServiceInstance;
}

