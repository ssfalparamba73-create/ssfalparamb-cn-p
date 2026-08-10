import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import type { CashEntryDTO, PaymentDTO, PaymentFilters } from "@/lib/backend/dto/payment.dto";
import { requestBackend } from "./backendClient";

export function getAdminPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams({ page: "1", pageSize: "100" });
  if (filters.category) params.set("category", filters.category);
  if (filters.method) params.set("method", filters.method);
  if (filters.status) params.set("status", filters.status);
  return requestBackend<PaginatedResult<PaymentDTO>>(`/api/v1/admin/payments?${params}`);
}

export function transitionAdminPayment(id: string, action: "approve" | "reject" | "cancel", reason?: string) {
  return requestBackend<PaymentDTO>(`/api/v1/admin/payments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

export function recordAdminCashEntry(input: Record<string, unknown>) {
  return requestBackend<CashEntryDTO>("/api/v1/admin/cash-entry", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
