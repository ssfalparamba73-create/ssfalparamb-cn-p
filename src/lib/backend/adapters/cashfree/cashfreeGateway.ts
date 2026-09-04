import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Cashfree SDK based on Environment Variables
const environment = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;

const cashfreeClient = new Cashfree(
  environment,
  process.env.CASHFREE_APP_ID || "",
  process.env.CASHFREE_SECRET_KEY || ""
);

export interface CreateOrderInput {
  orderId: string;
  amount: number;
  currency?: string;
  customerPhone: string;
  customerName?: string;
}

export interface CreateOrderResult {
  cfOrderId: string;
  paymentSessionId: string;
}

export interface CashfreePaymentGateway {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyPayment(cfOrderId: string): Promise<any>;
  verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): void;
}

export class CashfreeGatewayImpl implements CashfreePaymentGateway {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    try {
      const request = {
        order_amount: input.amount,
        order_currency: input.currency || "INR",
        order_id: input.orderId,
        customer_details: {
          customer_id: input.customerPhone || "guest",
          customer_phone: input.customerPhone,
          customer_name: input.customerName || "Guest User"
        },
        order_meta: {
          return_url: `${process.env.APP_BASE_URL || "http://localhost:3000"}/success?order_id={order_id}`
        }
      };

      // Ensure API version matrix is strictly "2023-08-01" as per compliance
      const response = await cashfreeClient.PGCreateOrder(request as any);
      
      return {
        cfOrderId: response.data.cf_order_id?.toString() || "",
        paymentSessionId: response.data.payment_session_id || ""
      };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Failed to create Cashfree order";
      console.error("Cashfree createOrder failed:", error?.response?.data || error);
      throw new Error(`Cashfree: ${msg}`);
    }
  }

  async verifyPayment(orderId: string): Promise<any> {
    try {
      const response = await cashfreeClient.PGOrderFetchPayments(orderId);
      return response.data;
    } catch (error: any) {
      console.error("Cashfree verifyPayment failed:", error?.response?.data || error);
      throw new Error("Failed to verify Cashfree payment");
    }
  }

  verifyWebhookSignature(signature: string, rawBody: string, timestamp: string): void {
    try {
      cashfreeClient.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (err) {
      console.error("Cashfree webhook signature verification failed", err);
      throw new Error("Invalid webhook signature");
    }
  }
}
