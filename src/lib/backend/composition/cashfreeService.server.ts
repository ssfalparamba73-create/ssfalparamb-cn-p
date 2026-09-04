import "server-only";

import { createCashfreeService } from "../services/cashfreeService";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { getReceiptService } from "./receiptService.server";
import { CashfreeGatewayImpl } from "../adapters/cashfree/cashfreeGateway";

/**
 * Server-only composition root for the Cashfree Service.
 * This guarantees the Cashfree credentials and adapter logic
 * are never bundled into the client browser.
 */

// Singleton instance to avoid recreating repositories per request
let cashfreeServiceInstance: ReturnType<typeof createCashfreeService> | null = null;

export function getCashfreeService() {
  if (!cashfreeServiceInstance) {
    const paymentRepository = new SupabasePaymentRepository();
    const receiptService = getReceiptService();
    const gateway = new CashfreeGatewayImpl();

    cashfreeServiceInstance = createCashfreeService({
      gateway,
      paymentRepository: {
        findById: paymentRepository.findById.bind(paymentRepository),
        findByGatewayOrderId: paymentRepository.findByGatewayOrderId.bind(paymentRepository),
        updateGatewayOrderId: paymentRepository.updateGatewayOrderId.bind(paymentRepository),
        confirmPayment: paymentRepository.confirmPayment.bind(paymentRepository),
        failPayment: paymentRepository.failPayment.bind(paymentRepository),
      },
      receiptService: {
        createForPayment: async (paymentId: string, actor) => {
          await receiptService.createForPayment(paymentId, actor);
        },
      },
    });
  }
  return cashfreeServiceInstance;
}
