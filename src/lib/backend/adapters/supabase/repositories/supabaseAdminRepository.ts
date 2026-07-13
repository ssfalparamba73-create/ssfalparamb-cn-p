import type { PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { AdminRepository, AdminUserFilters } from "../../../contracts/admin.contract";
import type { AdminUserDTO } from "../../../dto/admin.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToAdminUserDTO } from "../mappers/admin.mapper";

export class SupabaseAdminRepository implements AdminRepository {
  async findAdminById(id: string): Promise<AdminUserDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("admin_users").select("*").eq("id", id).single();
    if (error || !data) return null;
    
    const roles = await this.getAdminRoles(id);
    const perms = await this.getAdminPermissions(id);
    
    return mapRowToAdminUserDTO(data, roles, perms);
  }

  async findAdminByPhone(phone: string): Promise<AdminUserDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("admin_users").select("*").eq("phone", phone).single();
    if (error || !data) return null;
    
    const roles = await this.getAdminRoles(data.id);
    const perms = await this.getAdminPermissions(data.id);
    
    return mapRowToAdminUserDTO(data, roles, perms);
  }

  async getAdminPermissions(adminId: string): Promise<string[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("admin_permissions").select("permission_code").eq("admin_id", adminId);
    if (error || !data) return [];
    return data.map((p: any) => p.permission_code);
  }

  async getAdminRoles(adminId: string): Promise<string[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("admin_user_roles").select("roles!inner(name)").eq("admin_id", adminId);
    if (error || !data) return [];
    return data.map((r: any) => r.roles.name);
  }

  async listAdmins(filters: AdminUserFilters, pagination: PaginationInput): Promise<PaginatedResult<AdminUserDTO>> {
    const supabase = createSupabaseBackendClient();
    
    // Using a simpler query that works with Supabase PostgREST for inner joins
    let query = supabase.from("admin_users").select("*, admin_user_roles(roles(name))", { count: "exact" });
    
    if (filters.status) query = query.eq("status", filters.status);
    
    // Supabase JS doesn't easily support filtering on joined tables unless we use inner joins in the select string
    // Since roles are usually few, we'll do the standard query and filter in memory if role is provided, 
    // or just assume we don't have deep role filtering for now and just rely on the API view if needed.
    // For now, we'll fetch all and let's update the select if role filter is present:
    if (filters.role) {
      query = supabase.from("admin_users").select("*, admin_user_roles!inner(roles!inner(name))", { count: "exact" })
                      .eq("admin_user_roles.roles.name", filters.role);
      if (filters.status) query = query.eq("status", filters.status);
    }
    
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    
    const items = await Promise.all((data || []).map(async (row: any) => {
      const perms = await this.getAdminPermissions(row.id);
      const roles = (row.admin_user_roles || []).map((aur: any) => aur.roles?.name).filter(Boolean);
      return mapRowToAdminUserDTO(row, roles, perms);
    }));

    return {
      items,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }
}
