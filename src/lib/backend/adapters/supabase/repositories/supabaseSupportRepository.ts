import type { ActorContext } from "../../../contracts/common.contract";
import type {
  CreateSupportContactInput,
  SupportRepository,
  UpdateSupportContactInput,
} from "../../../contracts/support.contract";
import type { SupportContactDTO } from "../../../dto/support.dto";
import { createSupabaseBackendClient } from "../client";

interface SupportContactRow {
  id: string;
  name: string;
  role: string | null;
  phone: string;
  email: string | null;
  whatsapp_enabled: boolean;
  is_primary: boolean;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

function mapContact(row: SupportContactRow): SupportContactDTO {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? undefined,
    phone: row.phone,
    email: row.email ?? undefined,
    whatsappEnabled: row.whatsapp_enabled,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
    isActive: row.is_active,
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

export class SupabaseSupportRepository implements SupportRepository {
  async listActiveContacts(): Promise<SupportContactDTO[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("support_contacts")
      .select("id, name, role, phone, email, whatsapp_enabled, is_primary, sort_order, is_active, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ((data || []) as SupportContactRow[]).map(mapContact);
  }

  async listAdminContacts(): Promise<SupportContactDTO[]> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("support_contacts")
      .select("id, name, role, phone, email, whatsapp_enabled, is_primary, sort_order, is_active, updated_at")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return ((data || []) as SupportContactRow[]).map(mapContact);
  }

  async create(input: CreateSupportContactInput, actor: ActorContext): Promise<SupportContactDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_create_support_contact", {
      p_input: input,
      ...actorParams(actor),
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as SupportContactRow | null;
    if (!row) throw new Error("Support contact was not returned after creation.");
    return mapContact(row);
  }

  async update(id: string, input: UpdateSupportContactInput, actor: ActorContext): Promise<SupportContactDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_update_support_contact", {
      p_contact_id: id,
      p_input: input,
      ...actorParams(actor),
    });
    if (error?.code === "P0002") return null;
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as SupportContactRow | null;
    return row ? mapContact(row) : null;
  }

  async archive(id: string, actor: ActorContext): Promise<boolean> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_archive_support_contact", {
      p_contact_id: id,
      ...actorParams(actor),
    });
    if (error?.code === "P0002") return false;
    if (error) throw error;
    return true;
  }

  async reorder(ids: string[], actor: ActorContext): Promise<void> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_reorder_support_contacts", {
      p_contact_ids: ids,
      ...actorParams(actor),
    });
    if (error) throw error;
  }
}
