import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { AuditRepository, AuditLogFilters } from "../../../contracts/admin.contract";
import type { AuditLogDTO } from "../../../dto/admin.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToAuditLogDTO } from "../mappers/admin.mapper";

export class SupabaseAuditRepository implements AuditRepository {
  async list(filters: AuditLogFilters, pagination: PaginationInput): Promise<PaginatedResult<AuditLogDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (filters.action) query = query.eq("action", filters.action);
    if (filters.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters.severity) query = query.eq("severity", filters.severity);
    if (filters.from) query = query.gte("created_at", filters.from);
    if (filters.to) query = query.lte("created_at", filters.to);
    if (filters.search) {
      const search = filters.search.replace(/[,()%]/g, "").trim();
      if (search) {
        query = query.or(`actor_name.ilike.%${search}%,summary.ilike.%${search}%,entity_id.ilike.%${search}%`);
      }
    }

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;

    return {
      items: (data || []).map((row) => mapRowToAuditLogDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async record(event: {
    actor: ActorContext;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    severity?: AuditLogDTO["severity"];
    before?: unknown;
    after?: unknown;
  }): Promise<AuditLogDTO> {
    const supabase = createSupabaseBackendClient();
    let actorName = event.actor.actorName;
    if (!actorName) {
      if (event.actor.actorType === "system") actorName = "System";
      else if (event.actor.actorType === "admin") actorName = "Unknown Admin";
      else if (event.actor.actorType === "member") actorName = "Unknown Member";
      else actorName = "Public";
    }

    const { data, error } = await supabase.from("audit_logs").insert([{
      actor_admin_id: event.actor.adminId,
      actor_name: actorName,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      summary: event.summary,
      severity: event.severity || "info",
      before_data: event.before,
      after_data: event.after,
      ip: event.actor.ip,
      device: event.actor.device,
    }]).select("*").single();

    if (error) throw error;
    return mapRowToAuditLogDTO(data);
  }
}
