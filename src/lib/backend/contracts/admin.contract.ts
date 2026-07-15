import type {
  ActorContext,
  BackendResult,
  PaginatedResult,
  PaginationInput,
} from "./common.contract";
import type {
  AdminDashboardStatsDTO,
  AdminSessionDTO,
  AdminUserDTO,
  AuditLogDTO,
} from "../dto/admin.dto";
import type {
  CreateMemberInput,
  ResetMemberPinInput,
  UpdateMemberInput,
} from "./member.contract";
import type {
  MemberDTO,
  MemberListFilters,
} from "../dto/member.dto";

export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: "active" | "inactive";
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
}

export interface AdminAuthService {
  getCurrentAdmin(actor: ActorContext): Promise<BackendResult<AdminUserDTO>>;
  requirePermission(actor: ActorContext, permission: string): Promise<BackendResult<true>>;
}

export interface AdminMemberService {
  getMemberDetail(id: string, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  listMembers(
    filters: MemberListFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<MemberDTO>>>;
  createMember(input: CreateMemberInput, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  updateMember(id: string, input: UpdateMemberInput, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  resetMemberPin(id: string, input: ResetMemberPinInput, actor: ActorContext): Promise<BackendResult<MemberDTO>>;
  softDeleteMember(id: string, actor: ActorContext): Promise<BackendResult<void>>;
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

