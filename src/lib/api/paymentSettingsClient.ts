import { requestBackend } from "./backendClient";
import type { DuesFrequency } from "@/lib/payments/duesPeriod";

export type { DuesFrequency } from "@/lib/payments/duesPeriod";

export interface PaymentSettings {
  upiId: string;
  merchantName: string;
  qrCodeUrl: string;
  duesFrequency: DuesFrequency;
  baseTier: number;
  premiumTier: number;
  customMinimum: number;
  receiptPrefix: string;
  includeYear: boolean;
  upiEnabled: boolean;
  specialEventEnabled: boolean;
}

export function getPaymentSettings() {
  return requestBackend<PaymentSettings>("/api/v1/admin/settings/payments", {
    headers: { "x-ssf-admin-cache-bypass": "1" },
  });
}

export function updatePaymentSettings(settings: PaymentSettings) {
  return requestBackend<PaymentSettings>("/api/v1/admin/settings/payments", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
