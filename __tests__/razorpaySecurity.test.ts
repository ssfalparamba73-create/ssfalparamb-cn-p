import { describe, expect, it } from "vitest";
import {
  createRazorpaySignature,
  verifyRazorpaySignature,
} from "@/lib/backend/payments/razorpaySecurity";

describe("Razorpay HMAC verification", () => {
  const secret = "test-only-secret";
  const orderAndPayment = "order_test_123|pay_test_456";

  it("accepts the expected SHA-256 HMAC", () => {
    const signature = createRazorpaySignature(secret, orderAndPayment);

    expect(verifyRazorpaySignature(secret, orderAndPayment, signature)).toBe(true);
  });

  it("rejects a signature for a different order or payment", () => {
    const signature = createRazorpaySignature(secret, orderAndPayment);

    expect(verifyRazorpaySignature(secret, "order_other|pay_test_456", signature)).toBe(false);
    expect(verifyRazorpaySignature(secret, "order_test_123|pay_other", signature)).toBe(false);
  });

  it("rejects malformed signatures and empty secrets", () => {
    expect(verifyRazorpaySignature(secret, orderAndPayment, "not-a-signature")).toBe(false);
    expect(verifyRazorpaySignature("", orderAndPayment, "a".repeat(64))).toBe(false);
  });
});
