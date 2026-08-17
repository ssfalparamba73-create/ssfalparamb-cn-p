import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRazorpayService } from "@/lib/backend/services/razorpayService";
import type { ActorContext } from "@/lib/backend/contracts/common.contract";
import type { PaymentDTO } from "@/lib/backend/dto/payment.dto";

// Mock the gateway module
vi.mock("@/lib/backend/adapters/razorpay/razorpayGateway", () => ({
  createRazorpayOrder: vi.fn(),
  verifyRazorpaySignature: vi.fn(),
  verifyWebhookSignature: vi.fn(),
  fetchRazorpayPayment: vi.fn(),
  fetchRazorpayOrder: vi.fn(),
}));

// Mock the config module
vi.mock("@/lib/backend/config/razorpay.config", () => ({
  isRazorpayConfigured: vi.fn(() => true),
  getRazorpayConfig: vi.fn(() => ({
    keyId: "rzp_test_mock",
    keySecret: "mock_secret",
    webhookSecret: "mock_webhook_secret",
  })),
}));

const mockActor: ActorContext = {
  actorType: "public",
  requestId: "test_request_123",
};

const mockPayment: PaymentDTO = {
  id: "payment_123",
  receiptId: "RCPT-001",
  payerPhone: "9876543210",
  category: "monthly_dues",
  method: "upi",
  amount: 100,
  currency: "INR",
  status: "pending",
  recordedAt: new Date().toISOString(),
};

describe("RazorpayService", () => {
  let service: ReturnType<typeof createRazorpayService>;
  let mockPaymentRepository: {
    findById: ReturnType<typeof vi.fn<(id: string) => Promise<PaymentDTO | null>>>;
    findByGatewayOrderId: ReturnType<typeof vi.fn<(id: string) => Promise<PaymentDTO | null>>>;
    updateGatewayOrderId: ReturnType<typeof vi.fn<(paymentId: string, gatewayOrderId: string) => Promise<void>>>;
    confirmPayment: ReturnType<typeof vi.fn<(paymentId: string, gatewayPaymentId: string, gatewaySignature: string) => Promise<PaymentDTO>>>;
    failPayment: ReturnType<typeof vi.fn<(paymentId: string, reason?: string) => Promise<PaymentDTO>>>;
  };
  let mockReceiptService: {
    createForPayment: ReturnType<typeof vi.fn<(paymentId: string, actor: ActorContext) => Promise<void>>>;
  };

  beforeEach(() => {
    mockPaymentRepository = {
      findById: vi.fn(),
      findByGatewayOrderId: vi.fn(),
      updateGatewayOrderId: vi.fn(),
      confirmPayment: vi.fn(),
      failPayment: vi.fn(),
    };

    mockReceiptService = {
      createForPayment: vi.fn(),
    };

    service = createRazorpayService({
      paymentRepository: mockPaymentRepository,
      receiptService: mockReceiptService,
    });
  });

  describe("createOrder", () => {
    it("should create a Razorpay order successfully", async () => {
      const { createRazorpayOrder } = await import(
        "@/lib/backend/adapters/razorpay/razorpayGateway"
      );

      mockPaymentRepository.findById.mockResolvedValue(mockPayment);
      mockPaymentRepository.updateGatewayOrderId.mockResolvedValue(undefined);
      (createRazorpayOrder as any).mockResolvedValue({
        id: "order_razorpay_123",
        amount: 10000, // in paise
        currency: "INR",
        status: "created",
      });

      const result = await service.createOrder(
        {
          paymentId: "payment_123",
          amount: 100,
        },
        mockActor
      );

      expect(result.ok).toBe(true);
      expect(result.data?.orderId).toBe("order_razorpay_123");
      expect(result.data?.amount).toBe(100);
      expect(mockPaymentRepository.updateGatewayOrderId).toHaveBeenCalledWith(
        "payment_123",
        "order_razorpay_123"
      );
    });

    it("should fail if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      const result = await service.createOrder(
        {
          paymentId: "nonexistent_payment",
          amount: 100,
        },
        mockActor
      );

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("PAYMENT_NOT_FOUND");
    });

    it("should fail if payment is not pending", async () => {
      mockPaymentRepository.findById.mockResolvedValue({
        ...mockPayment,
        status: "confirmed",
      });

      const result = await service.createOrder(
        {
          paymentId: "payment_123",
          amount: 100,
        },
        mockActor
      );

      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain("not in a valid state");
    });

    it("should fail if amount mismatch", async () => {
      mockPaymentRepository.findById.mockResolvedValue(mockPayment);

      const result = await service.createOrder(
        {
          paymentId: "payment_123",
          amount: 200, // Different amount
        },
        mockActor
      );

      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain("amount mismatch");
    });
  });

  describe("verifyPayment", () => {
    it("should verify a valid payment", async () => {
      const {
        verifyRazorpaySignature,
        fetchRazorpayPayment,
        fetchRazorpayOrder,
      } = await import("@/lib/backend/adapters/razorpay/razorpayGateway");

      (verifyRazorpaySignature as any).mockReturnValue(true);
      mockPaymentRepository.findById.mockResolvedValue({ ...mockPayment, gatewayProvider: "razorpay", gatewayOrderId: "order_razorpay_123" });
      (fetchRazorpayOrder as any).mockResolvedValue({ amount: 10000, currency: "INR" });
      (fetchRazorpayPayment as any).mockResolvedValue({
        id: "pay_razorpay_456",
        status: "captured",
        amount: 10000,
        order_id: "order_razorpay_123",
        currency: "INR",
      });
      mockPaymentRepository.confirmPayment.mockResolvedValue({
        ...mockPayment,
        status: "confirmed",
      });

      const result = await service.verifyPayment(
        {
          razorpayOrderId: "order_razorpay_123",
          razorpayPaymentId: "pay_razorpay_456",
          razorpaySignature: "valid_signature",
          paymentId: "payment_123",
        },
        mockActor
      );

      expect(result.ok).toBe(true);
      expect(result.data?.status).toBe("confirmed");
      expect(mockReceiptService.createForPayment).toHaveBeenCalled();
    });

    it("should fail if signature is invalid", async () => {
      const { verifyRazorpaySignature } = await import(
        "@/lib/backend/adapters/razorpay/razorpayGateway"
      );

      (verifyRazorpaySignature as any).mockReturnValue(false);

      const result = await service.verifyPayment(
        {
          razorpayOrderId: "order_razorpay_123",
          razorpayPaymentId: "pay_razorpay_456",
          razorpaySignature: "invalid_signature",
          paymentId: "payment_123",
        },
        mockActor
      );

      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain("Invalid signature");
    });

    it("should fail if payment not captured", async () => {
      const {
        verifyRazorpaySignature,
        fetchRazorpayPayment,
        fetchRazorpayOrder,
      } = await import("@/lib/backend/adapters/razorpay/razorpayGateway");

      (verifyRazorpaySignature as any).mockReturnValue(true);
      mockPaymentRepository.findById.mockResolvedValue({ ...mockPayment, gatewayProvider: "razorpay", gatewayOrderId: "order_razorpay_123" });
      (fetchRazorpayOrder as any).mockResolvedValue({ amount: 10000, currency: "INR" });
      (fetchRazorpayPayment as any).mockResolvedValue({
        id: "pay_razorpay_456",
        status: "failed",
        amount: 10000,
        order_id: "order_razorpay_123",
        currency: "INR",
      });

      const result = await service.verifyPayment(
        {
          razorpayOrderId: "order_razorpay_123",
          razorpayPaymentId: "pay_razorpay_456",
          razorpaySignature: "valid_signature",
          paymentId: "payment_123",
        },
        mockActor
      );

      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain("not captured");
    });
  });

  describe("handleWebhook", () => {
    it("should handle payment.captured event", async () => {
      const {
        verifyWebhookSignature,
        fetchRazorpayPayment,
      } = await import("@/lib/backend/adapters/razorpay/razorpayGateway");

      const webhookBody = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_razorpay_789",
              order_id: "order_razorpay_123",
              amount: 10000,
              status: "captured",
              method: "upi",
              created_at: Date.now(),
            },
          },
        },
      });

      (verifyWebhookSignature as any).mockReturnValue(true);
      mockPaymentRepository.findByGatewayOrderId.mockResolvedValue(mockPayment);
      mockPaymentRepository.confirmPayment.mockResolvedValue({
        ...mockPayment,
        status: "confirmed",
      });

      const result = await service.handleWebhook(
        webhookBody,
        "valid_signature"
      );

      expect(result.ok).toBe(true);
      expect(result.data?.received).toBe(true);
      expect(mockPaymentRepository.confirmPayment).toHaveBeenCalled();
      expect(mockReceiptService.createForPayment).toHaveBeenCalled();
    });

    it("should handle payment.failed event", async () => {
      const { verifyWebhookSignature } = await import(
        "@/lib/backend/adapters/razorpay/razorpayGateway"
      );

      const webhookBody = JSON.stringify({
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: "pay_razorpay_789",
              order_id: "order_razorpay_123",
              amount: 10000,
              status: "failed",
              method: "upi",
              created_at: Date.now(),
            },
          },
        },
      });

      (verifyWebhookSignature as any).mockReturnValue(true);
      mockPaymentRepository.findByGatewayOrderId.mockResolvedValue(mockPayment);
      mockPaymentRepository.failPayment.mockResolvedValue({
        ...mockPayment,
        status: "failed",
      });

      const result = await service.handleWebhook(
        webhookBody,
        "valid_signature"
      );

      expect(result.ok).toBe(true);
      expect(result.data?.received).toBe(true);
      expect(mockPaymentRepository.failPayment).toHaveBeenCalled();
    });

    it("should reject invalid webhook signature", async () => {
      const { verifyWebhookSignature } = await import(
        "@/lib/backend/adapters/razorpay/razorpayGateway"
      );

      const webhookBody = JSON.stringify({ event: "payment.captured" });
      (verifyWebhookSignature as any).mockReturnValue(false);

      const result = await service.handleWebhook(
        webhookBody,
        "invalid_signature"
      );

      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain("Invalid webhook signature");
    });
  });
});
