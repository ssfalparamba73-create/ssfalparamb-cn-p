import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { PaymentDTO } from "../dto/payment.dto";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import {
  authError,
  validationError,
  paymentError,
  notFoundError,
  serverError,
} from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  fetchRazorpayPayment,
} from "../adapters/razorpay/razorpayGateway";
import { isRazorpayConfigured } from "../config/razorpay.config";

export interface CreateRazorpayOrderInput {
  paymentId: string;
  amount: number; // in INR
  currency?: string;
}

export interface VerifyRazorpayPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentId: string;
}

export interface WebhookEvent {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
        method: string;
        created_at: number;
      };
    };
  };
}

export interface RazorpayService {
  createOrder(
    input: CreateRazorpayOrderInput,
    actor: ActorContext
  ): Promise<
    BackendResult<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>
  >;
  verifyPayment(
    input: VerifyRazorpayPaymentInput,
    actor: ActorContext
  ): Promise<BackendResult<PaymentDTO>>;
  handleWebhook(
    body: string,
    signature: string
  ): Promise<BackendResult<{ received: boolean }>>;
}

export function createRazorpayService(deps: {
  paymentRepository: {
    findById(id: string): Promise<PaymentDTO | null>;
    findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentDTO | null>;
    updateGatewayOrderId(
      paymentId: string,
      gatewayOrderId: string
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
}): RazorpayService {
  const { paymentRepository, receiptService } = deps;

  return {
    async createOrder(
      input: CreateRazorpayOrderInput,
      actor: ActorContext
    ) {
      try {
        if (!isRazorpayConfigured()) {
          return fail(
            serverError(
              "Payment gateway is not configured. Please try again later."
            )
          );
        }

        const payment = await paymentRepository.findById(input.paymentId);
        if (!payment) {
          return fail(notFoundError("Payment not found.", ERROR_CODES.PAYMENT_NOT_FOUND));
        }

        if (payment.status !== "pending") {
          return fail(
            validationError(
              "Payment is not in a valid state for processing.",
              "paymentId"
            )
          );
        }

        // Verify the amount matches what we expect
        const expectedAmount = Math.round(payment.amount * 100); // Convert to paise
        if (input.amount * 100 !== expectedAmount) {
          return fail(
            validationError("Payment amount mismatch.", "amount", ERROR_CODES.INVALID_AMOUNT)
          );
        }

        const currency = input.currency || "INR";
        const receipt = `rcpt_${payment.receiptId}_${Date.now()}`;

        const order = await createRazorpayOrder({
          amount: expectedAmount,
          currency,
          receipt,
          notes: {
            paymentId: payment.id,
            receiptId: payment.receiptId,
            category: payment.category,
          },
        });

        await paymentRepository.updateGatewayOrderId(payment.id, order.id);

        return ok({
          orderId: order.id,
          amount: order.amount / 100, // Convert back to INR
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID!,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[${actor.requestId}] Razorpay order creation failed:`, message);
        if (message.includes("401 Unauthorized") || message.includes("Authentication failed")) {
          return fail(
            paymentError(
              "Razorpay authentication failed. Verify that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are a matching pair from the same Test or Live mode."
            )
          );
        }
        return fail(fromThrowable(err));
      }
    },

    async verifyPayment(
      input: VerifyRazorpayPaymentInput,
      actor: ActorContext
    ) {
      try {
        if (!isRazorpayConfigured()) {
          return fail(
            serverError(
              "Payment gateway is not configured. Please try again later."
            )
          );
        }

        // Verify signature
        const isValidSignature = verifyRazorpaySignature({
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
          razorpaySignature: input.razorpaySignature,
        });

        if (!isValidSignature) {
          return fail(
            paymentError(
              "Payment verification failed. Invalid signature.",
              ERROR_CODES.PAYMENT_VERIFICATION_FAILED
            )
          );
        }

        // Fetch payment details from Razorpay
        const razorpayPayment = await fetchRazorpayPayment(
          input.razorpayPaymentId
        );

        if (razorpayPayment.status !== "captured") {
          return fail(
            paymentError(
              `Payment was not captured. Status: ${razorpayPayment.status}`,
              ERROR_CODES.PAYMENT_VERIFICATION_FAILED
            )
          );
        }

        // Update payment in database
        const confirmedPayment = await paymentRepository.confirmPayment(
          input.paymentId,
          input.razorpayPaymentId,
          input.razorpaySignature
        );

        // Create receipt
        await receiptService.createForPayment(confirmedPayment.id, actor);

        return ok(confirmedPayment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async handleWebhook(body: string, signature: string) {
      try {
        if (!isRazorpayConfigured()) {
          return fail(
            serverError(
              "Payment gateway is not configured. Please try again later."
            )
          );
        }

        // Verify webhook signature
        const isValidSignature = verifyWebhookSignature(body, signature);
        if (!isValidSignature) {
          return fail(
            validationError("Invalid webhook signature.", "signature")
          );
        }

        const event: WebhookEvent = JSON.parse(body);

        // Handle payment.captured event
        if (event.event === "payment.captured") {
          const paymentEntity = event.payload.payment.entity;

          // Find payment by gateway order ID
          // This is idempotent - if payment is already confirmed, this will be a no-op
          const payment = await paymentRepository.findByGatewayOrderId(
            paymentEntity.order_id
          );

          if (payment && payment.status === "pending") {
            await paymentRepository.confirmPayment(
              payment.id,
              paymentEntity.id,
              signature
            );

            // Create receipt
            const systemActor: ActorContext = {
              actorType: "system",
              requestId: `webhook_${Date.now()}`,
            };
            await receiptService.createForPayment(payment.id, systemActor);
          }
        }

        // Handle payment.failed event
        if (event.event === "payment.failed") {
          const paymentEntity = event.payload.payment.entity;
          const payment = await paymentRepository.findByGatewayOrderId(
            paymentEntity.order_id
          );

          if (payment && payment.status === "pending") {
            await paymentRepository.failPayment(
              payment.id,
              `Razorpay payment failed: ${paymentEntity.status}`
            );
          }
        }

        return ok({ received: true });
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },
  };
}
