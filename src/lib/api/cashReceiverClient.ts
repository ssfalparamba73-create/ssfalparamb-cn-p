import { requestBackend } from "./backendClient";

export interface CashReceiver {
  id: string;
  name: string;
}

export function getCashReceivers(): Promise<CashReceiver[]> {
  return requestBackend<CashReceiver[]>("/api/v1/payments/cash-receivers");
}
