import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { PaymentDTO } from "../dto/payment.dto";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import {
  validationError,
  paymentError,
  notFoundError,
  serverError,
} from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import type { CashfreePaymentGateway } from "../adapters/cashfree/cashfreeGateway";

export interface CreateCashfreeOrderInput {
  paymentId: string;
  amount?: number;
  currency?: string;
  customerPhone?: string;
  customerName?: string;
}

export interface VerifyCashfreePaymentInput {
  cfOrderId: string;
}

export interface WebhookEvent {
  data: any;
  type: string;
  event_time: string;
}

export interface CashfreeService {
  createOrder(
    input: CreateCashfreeOrderInput,
    actor: ActorContext
  ): Promise<
    BackendResult<{
      cfOrderId: string;
      paymentSessionId: string;
    }>
  >;
  verifyPayment(
    input: VerifyCashfreePaymentInput,
    actor: ActorContext
  ): Promise<BackendResult<PaymentDTO>>;
  handleWebhook(
    rawBody: string,
    signature: string,
    timestamp: string
  ): Promise<BackendResult<{ received: boolean }>>;
}

export function createCashfreeService(deps: {
  gateway: CashfreePaymentGateway;
  paymentRepository: {
    findById(id: string): Promise<PaymentDTO | null>;
    findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentDTO | null>;
    updateGatewayOrderId(
      paymentId: string,
      gatewayOrderId: string,
      paymentSessionId?: string
    ): Promise<void>;
    confirmPayment(
      paymentId: string,
      gatewayPaymentId: string,
      gatewaySignature: string
    ): Promise<PaymentDTO>;
    failPayment(paymentId: string, reason?: string): Promise<PaymentDTO>;
  };
  receiptService: {
    createForPayment(paymentId: string, actor: ActorContext): Promise<void>;
  };
}): CashfreeService {
  const { gateway, paymentRepository, receiptService } = deps;

  return {
    async createOrder(input: CreateCashfreeOrderInput, actor: ActorContext) {
      try {
        const payment = await paymentRepository.findById(input.paymentId);
        if (!payment) {
          return fail(notFoundError("Payment intent not found", ERROR_CODES.PAYMENT_NOT_FOUND));
        }

        if (payment.status !== "pending") {
          return fail(
            paymentError(
              `Cannot initiate checkout for payment in ${payment.status} status`,
              ERROR_CODES.INVALID_PAYMENT_STATUS_TRANSITION
            )
          );
        }

        const gatewayResult = await gateway.createOrder({
          orderId: payment.id,
          amount: payment.amount,
          currency: input.currency || "INR",
          customerPhone: input.customerPhone || payment.payerPhone || "9999999999",
          customerName: input.customerName || payment.payerName || "Guest User",
        });

        await paymentRepository.updateGatewayOrderId(
          payment.id,
          gatewayResult.cfOrderId,
          gatewayResult.paymentSessionId
        );

        return ok({
          cfOrderId: gatewayResult.cfOrderId,
          paymentSessionId: gatewayResult.paymentSessionId,
        });
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : "Failed to create Cashfree order";
        return fail(paymentError(msg, ERROR_CODES.PAYMENT_GATEWAY_ERROR));
      }
    },

    async verifyPayment(input: VerifyCashfreePaymentInput, actor: ActorContext) {
      try {
        if (!input.cfOrderId) {
          return fail(validationError("cfOrderId is required", "cfOrderId", ERROR_CODES.VALIDATION_FAILED));
        }

        const payment = await paymentRepository.findByGatewayOrderId(input.cfOrderId);
        if (!payment) {
          return fail(notFoundError("Payment record not found for this Cashfree order ID", ERROR_CODES.PAYMENT_NOT_FOUND));
        }

        if (payment.status === "confirmed") {
          return ok(payment);
        }

        const cfPayments = await gateway.verifyPayment(input.cfOrderId);
        
        // Find the successful payment if any
        const successPayment = Array.isArray(cfPayments) 
          ? cfPayments.find(p => p.payment_status === "SUCCESS")
          : null;

        if (successPayment) {
          const confirmedPayment = await paymentRepository.confirmPayment(
            payment.id,
            successPayment.cf_payment_id?.toString() || input.cfOrderId,
            "" // No signature to pass here, verified via Cashfree API
          );

          await receiptService.createForPayment(payment.id, actor);
          return ok(confirmedPayment);
        } else {
          return fail(
            paymentError("Cashfree payment not successful or not found", ERROR_CODES.PAYMENT_VERIFICATION_FAILED)
          );
        }
      } catch (err: any) {
        return fail(serverError("Payment verification failed due to internal error"));
      }
    },

    async handleWebhook(rawBody: string, signature: string, timestamp: string) {
      try {
        // Cashfree mandates strict signature verification using raw string body
        gateway.verifyWebhookSignature(signature, rawBody, timestamp);

        const payload = JSON.parse(rawBody);
        
        if (payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
          const orderId = payload.data?.order?.order_id;
          const cfPaymentId = payload.data?.payment?.cf_payment_id?.toString();

          if (orderId) {
            const payment = await paymentRepository.findById(orderId);
            
            if (payment && payment.status === "pending") {
              await paymentRepository.confirmPayment(
                payment.id,
                cfPaymentId || "",
                signature
              );
              // Provide system context since this is an async webhook without typical user auth
              await receiptService.createForPayment(payment.id, { requestId: "webhook", role: "system" } as any);
            }
          }
        }

        return ok({ received: true });
      } catch (err) {
        console.error("Webhook processing error:", err);
        return fail(
          paymentError("Webhook signature validation or processing failed", ERROR_CODES.PAYMENT_VERIFICATION_FAILED)
        );
      }
    },
  };
}
