import { createBackendError } from "../errors/createBackendError";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  checkoutConfigId?: string;
}

let _config: RazorpayConfig | null = null;

function loadEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw createBackendError({
      code: "INTERNAL_ERROR",
      type: "server",
      message: `Missing required environment variable: ${name}`,
      retryable: false,
    });
  }
  return value;
}

export function getRazorpayConfig(): RazorpayConfig {
  if (_config) return _config;

  // NEXT_PUBLIC_RAZORPAY_KEY_ID was the server-side key name in older
  // deployments. Keep it as a fallback while preferring the private name.
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw createBackendError({
      code: "INTERNAL_ERROR",
      type: "server",
      message: "Missing required environment variable: RAZORPAY_KEY_ID",
      retryable: false,
    });
  }

  _config = {
    keyId,
    keySecret: loadEnvVar("RAZORPAY_KEY_SECRET"),
    checkoutConfigId: process.env.RAZORPAY_CHECKOUT_CONFIG_ID || undefined,
  };

  return _config;
}

export function getRazorpayWebhookSecret(): string {
  return loadEnvVar("RAZORPAY_WEBHOOK_SECRET");
}

export function getRazorpayPublicKey(): string {
  return getRazorpayConfig().keyId;
}

export function isRazorpayConfigured(): boolean {
  return !!(
    (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    process.env.RAZORPAY_KEY_SECRET
  );
}
