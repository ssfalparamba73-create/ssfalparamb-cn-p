import crypto from "crypto";
import { getRazorpayConfig } from "../../config/razorpay.config";

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  method: string;
  description: string;
  created_at: number;
}

export interface CreateOrderParams {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

async function razorpayApiCall<T>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const config = getRazorpayConfig();
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`
    );
  }

  return response.json() as Promise<T>;
}

export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrder> {
  const config = getRazorpayConfig();
  return razorpayApiCall<RazorpayOrder>("/orders", "POST", {
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
    ...(config.checkoutConfigId
      ? { checkout_config_id: config.checkoutConfigId }
      : {}),
  });
}

export function verifyRazorpaySignature(
  params: VerifyPaymentParams
): boolean {
  const config = getRazorpayConfig();
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  
  const expectedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === params.razorpaySignature;
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const config = getRazorpayConfig();
  
  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export async function fetchRazorpayPayment(
  paymentId: string
): Promise<RazorpayPayment> {
  return razorpayApiCall<RazorpayPayment>(`/payments/${paymentId}`, "GET");
}

export async function fetchRazorpayOrder(
  orderId: string
): Promise<RazorpayOrder> {
  return razorpayApiCall<RazorpayOrder>(`/orders/${orderId}`, "GET");
}
