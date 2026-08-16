import type { PaymentDTO } from "@/lib/backend/dto/payment.dto";
import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import { requestBackend } from "./backendClient";

export async function getAllAdminPayments(): Promise<PaymentDTO[]> {
  const payments: PaymentDTO[] = [];
  for (let page = 1; ; page += 1) {
    const result = await requestBackend<PaginatedResult<PaymentDTO>>(`/api/v1/admin/payments?page=${page}&pageSize=100`);
    payments.push(...result.items);
    if (!result.hasMore) return payments;
  }
}
