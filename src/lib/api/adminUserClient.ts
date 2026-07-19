import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import type { PromoteMemberToAdminInput, UpdateAdminUserAccessInput } from "@/lib/backend/contracts/admin.contract";
import type { AdminMemberCandidateDTO, AdminUserDTO, IssuedAdminCodeDTO } from "@/lib/backend/dto/admin.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";

export function getAdminUsers(): Promise<PaginatedResult<AdminUserDTO>> {
  return requestBackend<PaginatedResult<AdminUserDTO>>("/api/v1/admin/admin-users?page=1&pageSize=100");
}

export function searchAdminCandidates(search: string): Promise<AdminMemberCandidateDTO[]> {
  return requestBackend<AdminMemberCandidateDTO[]>(`/api/v1/admin/admin-users/candidates?search=${encodeURIComponent(search)}`);
}

export function promoteMemberToAdmin(input: PromoteMemberToAdminInput): Promise<IssuedAdminCodeDTO> {
  return requestBackend<IssuedAdminCodeDTO>("/api/v1/admin/admin-users", { method: "POST", body: JSON.stringify(input) });
}

export function updateAdminUserAccess(id: string, input: UpdateAdminUserAccessInput): Promise<AdminUserDTO> {
  return requestBackend<AdminUserDTO>(`/api/v1/admin/admin-users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deactivateAdminUser(id: string): Promise<void> {
  return requestBackendVoid(`/api/v1/admin/admin-users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function resetAdminUserCode(id: string): Promise<IssuedAdminCodeDTO> {
  return requestBackend<IssuedAdminCodeDTO>(`/api/v1/admin/admin-users/${encodeURIComponent(id)}/code`, { method: "POST" });
}
