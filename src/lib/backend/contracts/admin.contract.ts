import type {
  ActorContext,
  BackendResult,
  PaginatedResult,
  PaginationInput,
} from "./common.contract";
import type {
  AdminDashboardStatsDTO,
  AdminMemberCandidateDTO,
  AdminSessionDTO,
  AdminUserDTO,
  AuditLogDTO,
  IssuedAdminCodeDTO,
} from "../dto/admin.dto";
import type {
  CreateMemberInput,
  UpdateMemberInput,
} from "./member.contract";
import type {
  IssuedMemberPinDTO,
  MemberDTO,
  MemberListFilters,
} from "../dto/member.dto";

export interface AdminLoginInput {
  phone: string;
  pinOrOtp?: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: "active" | "inactive";
}

export interface PromoteMemberToAdminInput {
  memberId: string;
  role: AdminUserDTO["roles"][number];
  status: AdminUserDTO["status"];
}

export interface UpdateAdminUserAccessInput {
  role: AdminUserDTO["roles"][number];
  status: AdminUserDTO["status"];
}

export interface AdminCodeMutationResult {
  adminId: string;
  issuedAt: string;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  entityType?: string;
  severity?: "info" | "warning" | "error" | "critical";
  from?: string;
  to?: string;
}

export interface AdminRepository {
  findAdminById(id: string): Promise<AdminUserDTO | null>;
  findAdminByPhone(phone: string): Promise<AdminUserDTO | null>;
  getAdminPermissions(adminId: string): Promise<string[]>;
  listAdmins(filters: AdminUserFilters, pagination: PaginationInput): Promise<PaginatedResult<AdminUserDTO>>;
  searchMemberCandidates(search: string, limit: number): Promise<AdminMemberCandidateDTO[]>;
  promoteMember(
    input: PromoteMemberToAdminInput,
    code: string,
    actor: ActorContext
  ): Promise<AdminCodeMutationResult>;
  updateAdminAccess(
    adminId: string,
    input: UpdateAdminUserAccessInput,
    actor: ActorContext
  ): Promise<void>;
  resetAdminCode(
    adminId: string,
    code: string,
    actor: ActorContext
  ): Promise<AdminCodeMutationResult>;
  softDeactivateAdmin(adminId: string, actor: ActorContext): Promise<void>;
}

export interface AdminUserService {
  listAdmins(
    filters: AdminUserFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<AdminUserDTO>>>;
  searchMemberCandidates(
    search: string,
    actor: ActorContext
  ): Promise<BackendResult<AdminMemberCandidateDTO[]>>;
  promoteMember(
    input: PromoteMemberToAdminInput,
    actor: ActorContext
  ): Promise<BackendResult<IssuedAdminCodeDTO>>;
  updateAdminAccess(
    adminId: string,
    input: UpdateAdminUserAccessInput,
    actor: ActorContext
  ): Promise<BackendResult<AdminUserDTO>>;
  resetAdminCode(
    adminId: string,
    actor: ActorContext
  ): Promise<BackendResult<IssuedAdminCodeDTO>>;
  softDeactivateAdmin(
    adminId: string,
    actor: ActorContext
  ): Promise<BackendResult<void>>;
}

export interface AdminAuthService {
  login(input: AdminLoginInput, actor: ActorContext): Promise<BackendResult<AdminSessionDTO>>;
  getCurrentAdmin(actor: ActorContext): Promise<BackendResult<AdminUserDTO>>;
  requirePermission(actor: ActorContext, permission: string): Promise<BackendResult<true>>;
}

export interface AdminMemberService {
  getMember(id: string, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  listMembers(
    filters: MemberListFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<MemberDTO>>>;
  createMember(input: CreateMemberInput, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  updateMember(id: string, input: UpdateMemberInput, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  softDeleteMember(id: string, actor: ActorContext): Promise<BackendResult<void>>;
  prepareMemberInvitation(id: string, actor: ActorContext): Promise<BackendResult<IssuedMemberPinDTO>>;
  issueMemberPin(id: string, actor: ActorContext): Promise<BackendResult<IssuedMemberPinDTO>>;
}

export interface AdminDashboardService {
  getDashboardStats(actor: ActorContext): Promise<BackendResult<AdminDashboardStatsDTO>>;
}

export interface AuditRepository {
  list(filters: AuditLogFilters, pagination: PaginationInput): Promise<PaginatedResult<AuditLogDTO>>;
  record(event: {
    actor: ActorContext;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    severity?: AuditLogDTO["severity"];
    before?: unknown;
    after?: unknown;
  }): Promise<AuditLogDTO>;
}

export interface AuditService {
  listAuditLogs(
    filters: AuditLogFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<AuditLogDTO>>>;
}
