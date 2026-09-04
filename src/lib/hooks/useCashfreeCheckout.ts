"use client";

import { useState, useCallback } from "react";
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

export function useCashfreeCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(async (options: {
    paymentSessionId: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);

      const cashfree = await load({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? "production" : "sandbox"
      });

      if (!cashfree) {
        throw new Error("Cashfree SDK failed to initialize.");
      }

      const checkoutOptions = {
        paymentSessionId: options.paymentSessionId,
        redirectTarget: "_self", // Can be "_modal" or "_self". For full page redirect, use "_self".
      };

      await cashfree.checkout(checkoutOptions);
      // Note: In redirect mode "_self", the browser will navigate away immediately.
      // If you switch to "_modal" later, you can listen to events or handle success here.
      
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (err: any) {
      console.error("Checkout initiation failed:", err);
      setError(err.message || "Failed to initialize payment gateway");
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { initiateCheckout, isProcessing, error, clearError };
}
