import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import type { AuditLogDTO } from "@/lib/backend/dto/admin.dto";
import { requestBackend } from "./backendClient";

export function getAuditLogs(page = 1, pageSize = 100): Promise<PaginatedResult<AuditLogDTO>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return requestBackend<PaginatedResult<AuditLogDTO>>(`/api/v1/admin/audit-logs?${params}`);
}

export async function getAllAuditLogs(): Promise<AuditLogDTO[]> {
  const logs: AuditLogDTO[] = [];
  let page = 1;
  while (true) {
    const result = await getAuditLogs(page, 100);
    logs.push(...result.items);
    if (!result.hasMore) return logs;
    page += 1;
  }
}
