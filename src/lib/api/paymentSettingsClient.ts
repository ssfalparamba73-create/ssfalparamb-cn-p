import { requestBackend } from "./backendClient";

export type DuesFrequency = "monthly" | "bimonthly" | "quarterly";

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
}

export function getPaymentSettings() {
  return requestBackend<PaymentSettings>("/api/v1/admin/settings/payments");
}

export function updatePaymentSettings(settings: PaymentSettings) {
  return requestBackend<PaymentSettings>("/api/v1/admin/settings/payments", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
