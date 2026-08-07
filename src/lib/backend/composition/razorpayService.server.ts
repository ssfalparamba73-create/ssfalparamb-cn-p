import "server-only";

import { createRazorpayService } from "../services/razorpayService";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { getReceiptService } from "./receiptService.server";

/**
 * Server-only composition root for the Razorpay Service.
 * This guarantees the Razorpay credentials and adapter logic
 * are never bundled into the client browser.
 */

// Singleton instance to avoid recreating repositories per request
let razorpayServiceInstance: ReturnType<typeof createRazorpayService> | null = null;

export function getRazorpayService() {
  if (!razorpayServiceInstance) {
    const paymentRepository = new SupabasePaymentRepository();
    const receiptService = getReceiptService();

    razorpayServiceInstance = createRazorpayService({
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
  return razorpayServiceInstance;
}
