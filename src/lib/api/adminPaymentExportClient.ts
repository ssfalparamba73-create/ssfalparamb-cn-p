import type { PaymentDTO, PaymentCategory, PaymentStatus } from "@/lib/backend/dto/payment.dto";
import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import { requestBackend } from "./backendClient";

export interface PaymentExportRange {
  from?: string;
  to?: string;
  status?: PaymentStatus;
  category?: PaymentCategory;
}

export interface OutstandingDuesExportItem {
  memberCode: string;
  name: string;
  phone: string;
  area: string;
  unpaidMonths: string[];
  currentBalance: number;
  lastPaidAt: string | null;
}

export async function getOutstandingDuesExport(fromMonth?: string, toMonth?: string): Promise<OutstandingDuesExportItem[]> {
  const params = new URLSearchParams();
  if (fromMonth && toMonth) {
    params.set("fromMonth", fromMonth);
    params.set("toMonth", toMonth);
  }
  const query = params.size ? `?${params.toString()}` : "";
  const result = await requestBackend<{ items: OutstandingDuesExportItem[] }>(`/api/v1/admin/exports/dues${query}`);
  return result.items;
}

export async function getAllAdminPayments(range: PaymentExportRange = {}): Promise<PaymentDTO[]> {
  const pageSize = 100;
  const fetchPage = async (page: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    params.set("status", range.status ?? "confirmed");
    if (range.category) params.set("category", range.category);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    return requestBackend<PaginatedResult<PaymentDTO>>(`/api/v1/admin/payments?${params}`);
  };

  const firstPage = await fetchPage(1);
  const payments = [...firstPage.items];
  if (!firstPage.hasMore || !firstPage.total) return payments;

  const pageCount = Math.ceil(firstPage.total / pageSize);
  const batchSize = 4;
  for (let firstPageNumber = 2; firstPageNumber <= pageCount; firstPageNumber += batchSize) {
    const pageNumbers = Array.from(
      { length: Math.min(batchSize, pageCount - firstPageNumber + 1) },
      (_, index) => firstPageNumber + index,
    );
    const pages = await Promise.all(pageNumbers.map(fetchPage));
    for (const page of pages) payments.push(...page.items);
  }
  return payments;
}
