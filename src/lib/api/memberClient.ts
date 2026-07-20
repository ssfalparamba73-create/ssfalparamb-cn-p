import type { PaginatedResult } from "@/lib/backend/contracts/common.contract";
import type { MemberDTO } from "@/lib/backend/dto/member.dto";
import type { IssuedMemberPinDTO } from "@/lib/backend/dto/member.dto";
import type { CompleteMemberProfileInput, CreateMemberInput, UpdateMemberInput } from "@/lib/backend/contracts/member.contract";
import type { UpdateMemberProfileInput } from "@/lib/backend/contracts/member.contract";
import type { MemberDirectoryItemDTO, MemberListFilters, MemberProfileDTO } from "@/lib/backend/dto/member.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";

export function getAdminMembers(page = 1, pageSize = 100, search?: string): Promise<PaginatedResult<MemberDTO>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search?.trim()) params.set("search", search.trim());
  return requestBackend<PaginatedResult<MemberDTO>>(`/api/v1/admin/members?${params}`);
}

export function getAdminMember(id: string): Promise<MemberDTO> {
  return requestBackend<MemberDTO>(`/api/v1/admin/members/${encodeURIComponent(id)}`);
}

export function createAdminMember(input: CreateMemberInput): Promise<MemberDTO> {
  return requestBackend<MemberDTO>("/api/v1/admin/members", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminMember(id: string, input: UpdateMemberInput): Promise<MemberDTO> {
  return requestBackend<MemberDTO>(`/api/v1/admin/members/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function softDeleteAdminMember(id: string): Promise<void> {
  return requestBackendVoid(`/api/v1/admin/members/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function issueAdminMemberPin(id: string): Promise<IssuedMemberPinDTO> {
  return requestBackend<IssuedMemberPinDTO>(`/api/v1/admin/members/${encodeURIComponent(id)}/invitation`, {
    method: "POST",
  });
}

export function resetAdminMemberPin(id: string): Promise<IssuedMemberPinDTO> {
  return requestBackend<IssuedMemberPinDTO>(`/api/v1/admin/members/${encodeURIComponent(id)}/pin`, {
    method: "POST",
  });
}

export async function getAllAdminMembers(): Promise<MemberDTO[]> {
  const members: MemberDTO[] = [];
  let page = 1;

  while (true) {
    const result = await getAdminMembers(page, 100);
    members.push(...result.items);
    if (!result.hasMore) return members;
    page += 1;
  }
}

export function getAdminBloodDonors(page = 1, pageSize = 100): Promise<PaginatedResult<MemberDTO>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    status: "active",
    isBloodDonor: "true",
  });
  return requestBackend<PaginatedResult<MemberDTO>>(`/api/v1/admin/members?${params}`);
}

export async function getAllAdminBloodDonors(): Promise<MemberDTO[]> {
  const donors: MemberDTO[] = [];
  let page = 1;

  while (true) {
    const result = await getAdminBloodDonors(page, 100);
    donors.push(...result.items);
    if (!result.hasMore) return donors;
    page += 1;
  }
}

export function getCurrentMemberProfile(): Promise<MemberProfileDTO> {
  return requestBackend<MemberProfileDTO>("/api/v1/member/profile");
}

export function updateCurrentMemberProfile(input: UpdateMemberProfileInput): Promise<MemberProfileDTO> {
  return requestBackend<MemberProfileDTO>("/api/v1/member/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function completeCurrentMemberProfile(input: CompleteMemberProfileInput): Promise<MemberProfileDTO> {
  return requestBackend<MemberProfileDTO>("/api/v1/member/profile/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMemberDirectory(filters: Pick<MemberListFilters, "search" | "area" | "bloodGroup" | "donorAvailable"> = {}): Promise<PaginatedResult<MemberDirectoryItemDTO>> {
  const params = new URLSearchParams({ page: "1", pageSize: "100" });
  if (filters.search) params.set("search", filters.search);
  if (filters.area) params.set("area", filters.area);
  if (filters.bloodGroup) params.set("bloodGroup", filters.bloodGroup);
  if (filters.donorAvailable !== undefined) params.set("donorAvailable", String(filters.donorAvailable));
  return requestBackend<PaginatedResult<MemberDirectoryItemDTO>>(`/api/v1/member/directory?${params}`);
}
