import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import type { MemberPaymentHistoryItemDTO } from "@/lib/backend/dto/payment.dto";
import { requestBackend } from "./backendClient";

export function getMemberPayments() {
  return requestBackend<PaginatedResult<MemberPaymentHistoryItemDTO>>(
    "/api/v1/member/payments?page=1&pageSize=50"
  );
}
