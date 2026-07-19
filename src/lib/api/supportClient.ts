import type { SupportContactDTO } from "@/lib/backend/dto/support.dto";
import type { CreateSupportContactInput, UpdateSupportContactInput } from "@/lib/backend/contracts/support.contract";
import { requestBackend, requestBackendVoid } from "./backendClient";

export function getSupportContacts(): Promise<SupportContactDTO[]> {
  return requestBackend<SupportContactDTO[]>("/api/v1/support/contacts");
}

export function getAdminSupportContacts(): Promise<SupportContactDTO[]> {
  return requestBackend<SupportContactDTO[]>("/api/v1/admin/support-contacts");
}

export function createAdminSupportContact(input: CreateSupportContactInput): Promise<SupportContactDTO> {
  return requestBackend<SupportContactDTO>("/api/v1/admin/support-contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminSupportContact(id: string, input: UpdateSupportContactInput): Promise<SupportContactDTO> {
  return requestBackend<SupportContactDTO>(`/api/v1/admin/support-contacts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveAdminSupportContact(id: string): Promise<void> {
  return requestBackendVoid(`/api/v1/admin/support-contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function reorderAdminSupportContacts(ids: string[]): Promise<void> {
  return requestBackendVoid("/api/v1/admin/support-contacts/reorder", {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
  });
}
