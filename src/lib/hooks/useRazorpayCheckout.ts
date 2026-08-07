"use client";

import { useState, useCallback } from "react";

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayWindow {
  Razorpay: new (options: RazorpayCheckoutOptions) => {
    open: () => void;
    on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
  };
}

declare global {
  interface Window {
    Razorpay?: RazorpayWindow["Razorpay"];
  }
}

export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const createOrder = useCallback(async (paymentId: string, amount: number) => {
    const response = await fetch("/api/v1/payments/razorpay/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentId,
        amount,
        currency: "INR",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to create order");
    }

    return response.json();
  }, []);

  const verifyPayment = useCallback(async (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentId: string;
  }) => {
    const response = await fetch("/api/v1/payments/razorpay/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Payment verification failed");
    }

    return response.json();
  }, []);

  const initiateCheckout = useCallback(async (params: {
    paymentId: string;
    amount: number;
    memberName?: string;
    memberPhone?: string;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
    onDismiss?: () => void;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please try again.");
      }

      // Create order
      const orderResult = await createOrder(params.paymentId, params.amount);
      
      if (!orderResult.ok) {
        throw new Error(orderResult.error?.message || "Failed to create payment order");
      }

      const { orderId, keyId, currency } = orderResult.data;

      // Initialize Razorpay checkout
      const options: RazorpayCheckoutOptions = {
        key: keyId,
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: currency || "INR",
        name: "SSF Alparamba Unit",
        description: "Payment for SSF Alparamba Unit",
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment on server
            const verifyResult = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: params.paymentId,
            });

            if (verifyResult.ok) {
              params.onSuccess?.(params.paymentId);
            } else {
              throw new Error(verifyResult.error?.message || "Payment verification failed");
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Payment verification failed";
            setError(message);
            params.onError?.(message);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: params.memberName || "",
          contact: params.memberPhone || "",
        },
        notes: {
          paymentId: params.paymentId,
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            params.onDismiss?.();
          },
        },
      };

      const razorpay = new window.Razorpay!(options);
      
      razorpay.on("payment.failed", (response) => {
        const message = response.error.description || "Payment failed";
        setError(message);
        params.onError?.(message);
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      params.onError?.(message);
      setIsProcessing(false);
    }
  }, [loadRazorpayScript, createOrder, verifyPayment]);

  return {
    initiateCheckout,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
