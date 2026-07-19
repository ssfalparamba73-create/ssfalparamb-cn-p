import type { ActorContext } from "../../../contracts/common.contract";
import type {
  CreateSpecialEventInput,
  EventRepository,
  UpdateSpecialEventInput,
} from "../../../contracts/event.contract";
import type { EventReceiptTheme, SpecialEventDTO } from "../../../dto/event.dto";
import { createSupabaseBackendClient } from "../client";

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  suggested_amount: number | string | null;
  minimum_amount: number | string;
  receipt_theme: EventReceiptTheme;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapEvent(row: EventRow): SpecialEventDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    suggestedAmount: row.suggested_amount == null ? undefined : Number(row.suggested_amount),
    minimumAmount: Number(row.minimum_amount),
    receiptTheme: row.receipt_theme,
    isActive: row.is_active,
    startsAt: row.start_date ?? undefined,
    endsAt: row.end_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function actorParams(actor: ActorContext) {
  if (!actor.adminId) throw new Error("Admin actor ID is required.");
  return {
    p_actor_admin_id: actor.adminId,
    p_actor_name: actor.actorName ?? null,
    p_ip: actor.ip ?? null,
    p_device: actor.device ?? null,
  };
}

export class SupabaseEventRepository implements EventRepository {
  async list(): Promise<SpecialEventDTO[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("special_events")
      .select("id, name, description, suggested_amount, minimum_amount, receipt_theme, is_active, start_date, end_date, created_at, updated_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data || []) as EventRow[]).map(mapEvent);
  }

  async create(input: CreateSpecialEventInput, actor: ActorContext): Promise<SpecialEventDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_create_special_event", {
      p_input: input,
      ...actorParams(actor),
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as EventRow | null;
    if (!row) throw new Error("Special event was not returned after creation.");
    return mapEvent(row);
  }

  async update(id: string, input: UpdateSpecialEventInput, actor: ActorContext): Promise<SpecialEventDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_update_special_event", {
      p_event_id: id,
      p_input: input,
      ...actorParams(actor),
    });
    if (error?.code === "P0002") return null;
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as EventRow | null;
    return row ? mapEvent(row) : null;
  }

  async archive(id: string, actor: ActorContext): Promise<boolean> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_archive_special_event", {
      p_event_id: id,
      ...actorParams(actor),
    });
    if (error?.code === "P0002") return false;
    if (error) throw error;
    return true;
  }
}
