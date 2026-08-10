import { createBackendError } from "../errors/createBackendError";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
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

  _config = {
    keyId: loadEnvVar("RAZORPAY_KEY_ID"),
    keySecret: loadEnvVar("RAZORPAY_KEY_SECRET"),
    webhookSecret: loadEnvVar("RAZORPAY_WEBHOOK_SECRET"),
    checkoutConfigId: process.env.RAZORPAY_CHECKOUT_CONFIG_ID || undefined,
  };

  return _config;
}

export function getRazorpayPublicKey(): string {
  return getRazorpayConfig().keyId;
}

export function isRazorpayConfigured(): boolean {
  try {
    return !!(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
  } catch {
    return false;
  }
}
