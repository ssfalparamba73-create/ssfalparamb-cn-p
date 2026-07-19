import type { CreateSpecialEventInput, UpdateSpecialEventInput } from "@/lib/backend/contracts/event.contract";
import type { SpecialEventDTO } from "@/lib/backend/dto/event.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";

export function getAdminEvents(): Promise<SpecialEventDTO[]> {
  return requestBackend<SpecialEventDTO[]>("/api/v1/admin/events");
}

export function createAdminEvent(input: CreateSpecialEventInput): Promise<SpecialEventDTO> {
  return requestBackend<SpecialEventDTO>("/api/v1/admin/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminEvent(id: string, input: UpdateSpecialEventInput): Promise<SpecialEventDTO> {
  return requestBackend<SpecialEventDTO>(`/api/v1/admin/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function archiveAdminEvent(id: string): Promise<void> {
  return requestBackendVoid(`/api/v1/admin/events/${encodeURIComponent(id)}`, { method: "DELETE" });
}
