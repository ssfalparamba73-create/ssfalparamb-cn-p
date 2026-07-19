import type {
  AdminCodeMutationResult,
  AdminRepository,
  AdminUserFilters,
  PromoteMemberToAdminInput,
  UpdateAdminUserAccessInput,
} from "../../../contracts/admin.contract";
import type {
  ActorContext,
  PaginatedResult,
  PaginationInput,
} from "../../../contracts/common.contract";
import type {
  AdminMemberCandidateDTO,
  AdminUserDTO,
} from "../../../dto/admin.dto";
import {
  conflictError,
  notFoundError,
  permissionError,
  validationError,
} from "../../../errors/createBackendError";
import { ERROR_CODES } from "../../../errors/errorCodes";
import { createSupabaseBackendClient } from "../client";
import { mapRowToAdminUserDTO } from "../mappers/admin.mapper";

interface AdminRoleJoinRow {
  roles?: { name?: string } | Array<{ name?: string }> | null;
}

interface AdminListRow extends Record<string, unknown> {
  id: string;
  admin_user_roles?: AdminRoleJoinRow[] | null;
}

interface CandidateMemberRow {
  id: string;
  member_code: string;
  name: string;
  phone: string;
}

interface ExistingAdminIdentityRow {
  member_id: string | null;
  phone: string;
}

function actorRpcParams(actor: ActorContext) {
  if (!actor.adminId) throw new Error("Admin actor ID is required.");
  return {
    p_actor_admin_id: actor.adminId,
    p_actor_name: actor.actorName ?? null,
    p_ip: actor.ip ?? null,
    p_device: actor.device ?? null,
  };
}

function roleNames(row: AdminListRow): string[] {
  return (row.admin_user_roles ?? []).flatMap((join) => {
    if (Array.isArray(join.roles)) {
      return join.roles.map((role) => role.name).filter((name): name is string => Boolean(name));
    }
    return join.roles?.name ? [join.roles.name] : [];
  });
}

function throwAdminMutationError(error: { code?: string; message?: string }): never {
  const message = error.message || "Admin user operation failed.";
  if (error.code === "23505") {
    throw conflictError(message, ERROR_CODES.ADMIN_ALREADY_EXISTS);
  }
  if (error.code === "P0001") {
    throw conflictError(message, ERROR_CODES.ADMIN_GUARD_VIOLATION);
  }
  if (error.code === "22023") {
    throw validationError(message);
  }
  if (error.code === "P0002") {
    throw notFoundError(message, ERROR_CODES.ADMIN_NOT_FOUND);
  }
  if (error.code === "42501") {
    throw permissionError(message, ERROR_CODES.ADMIN_PERMISSION_DENIED);
  }
  throw error;
}

function parseCodeMutationResult(data: unknown): AdminCodeMutationResult {
  if (
    typeof data !== "object"
    || data === null
    || !("adminId" in data)
    || !("issuedAt" in data)
    || typeof data.adminId !== "string"
    || typeof data.issuedAt !== "string"
  ) {
    throw new Error("Admin code operation returned an invalid result.");
  }
  return { adminId: data.adminId, issuedAt: data.issuedAt };
}

export class SupabaseAdminRepository implements AdminRepository {
  async findAdminById(id: string): Promise<AdminUserDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const roles = await this.getAdminRoles(id);
    const permissions = await this.getAdminPermissions(id);
    return mapRowToAdminUserDTO(data, roles, permissions);
  }

  async findAdminByPhone(phone: string): Promise<AdminUserDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const roles = await this.getAdminRoles(data.id);
    const permissions = await this.getAdminPermissions(data.id);
    return mapRowToAdminUserDTO(data, roles, permissions);
  }

  async getAdminPermissions(adminId: string): Promise<string[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("admin_permissions")
      .select("permission_code")
      .eq("admin_id", adminId);
    if (error) throw error;
    return (data || []).map((permission) => permission.permission_code);
  }

  private async getAdminRoles(adminId: string): Promise<string[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("admin_user_roles")
      .select("roles!inner(name)")
      .eq("admin_id", adminId);
    if (error) throw error;
    return roleNames({ id: adminId, admin_user_roles: (data || []) as AdminRoleJoinRow[] });
  }

  async listAdmins(
    filters: AdminUserFilters,
    pagination: PaginationInput
  ): Promise<PaginatedResult<AdminUserDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = filters.role
      ? supabase
          .from("admin_users")
          .select("*, admin_user_roles!admin_user_roles_admin_id_fkey!inner(roles!inner(name))", { count: "exact" })
          .eq("admin_user_roles.roles.name", filters.role)
      : supabase
          .from("admin_users")
          .select("*, admin_user_roles!admin_user_roles_admin_id_fkey(roles(name))", { count: "exact" });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) {
      const search = filters.search.replace(/[,()%]/g, "").trim();
      if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count, error } = await query
      .order("created_at", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;

    const items = await Promise.all(
      ((data || []) as AdminListRow[]).map(async (row) => {
        const permissions = await this.getAdminPermissions(row.id);
        return mapRowToAdminUserDTO(row, roleNames(row), permissions);
      })
    );

    return {
      items,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async searchMemberCandidates(
    search: string,
    limit: number
  ): Promise<AdminMemberCandidateDTO[]> {
    const supabase = createSupabaseBackendClient();
    const safeSearch = search.replace(/[,()%]/g, "").trim();
    const fetchLimit = Math.min(Math.max(limit * 3, limit), 60);
    const { data: members, error: memberError } = await supabase
      .from("members")
      .select("id, member_code, name, phone")
      .eq("status", "active")
      .or(`name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,member_code.ilike.%${safeSearch}%`)
      .order("name", { ascending: true })
      .limit(fetchLimit);
    if (memberError) throw memberError;

    const { data: admins, error: adminError } = await supabase
      .from("admin_users")
      .select("member_id, phone");
    if (adminError) throw adminError;

    const linkedMemberIds = new Set(
      ((admins || []) as ExistingAdminIdentityRow[])
        .map((admin) => admin.member_id)
        .filter((memberId): memberId is string => Boolean(memberId))
    );
    const adminPhones = new Set(
      ((admins || []) as ExistingAdminIdentityRow[]).map((admin) => admin.phone)
    );

    return ((members || []) as CandidateMemberRow[])
      .filter((member) => !linkedMemberIds.has(member.id) && !adminPhones.has(member.phone))
      .slice(0, limit)
      .map((member) => ({
        id: member.id,
        memberCode: member.member_code,
        name: member.name,
        phone: member.phone,
      }));
  }

  async promoteMember(
    input: PromoteMemberToAdminInput,
    code: string,
    actor: ActorContext
  ): Promise<AdminCodeMutationResult> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_promote_member", {
      p_member_id: input.memberId,
      p_role: input.role,
      p_status: input.status,
      p_code: code,
      ...actorRpcParams(actor),
    });
    if (error) throwAdminMutationError(error);
    return parseCodeMutationResult(data);
  }

  async updateAdminAccess(
    adminId: string,
    input: UpdateAdminUserAccessInput,
    actor: ActorContext
  ): Promise<void> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_update_user_role_status", {
      p_admin_id: adminId,
      p_role: input.role,
      p_status: input.status,
      ...actorRpcParams(actor),
    });
    if (error) throwAdminMutationError(error);
  }

  async resetAdminCode(
    adminId: string,
    code: string,
    actor: ActorContext
  ): Promise<AdminCodeMutationResult> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_reset_user_code", {
      p_admin_id: adminId,
      p_code: code,
      ...actorRpcParams(actor),
    });
    if (error) throwAdminMutationError(error);
    return parseCodeMutationResult(data);
  }

  async softDeactivateAdmin(adminId: string, actor: ActorContext): Promise<void> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_soft_deactivate_user", {
      p_admin_id: adminId,
      ...actorRpcParams(actor),
    });
    if (error) throwAdminMutationError(error);
  }
}
