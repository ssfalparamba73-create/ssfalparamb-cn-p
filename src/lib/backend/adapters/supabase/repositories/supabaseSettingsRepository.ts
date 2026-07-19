import type { ActorContext } from "../../../contracts/common.contract";
import type { SettingsRepository } from "../../../contracts/settings.contract";
import type { MemberInvitationTemplateDTO } from "../../../dto/settings.dto";
import { permissionError, validationError } from "../../../errors/createBackendError";
import {
  MEMBER_INVITATION_ALLOWED_PLACEHOLDERS,
} from "@/lib/memberInvitation";
import { createSupabaseBackendClient } from "../client";

interface InvitationSettingRow {
  value: unknown;
  updated_at: string;
}

interface InvitationSettingRpcRow {
  template: string;
  updated_at: string;
}

function parseTemplate(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "template" in value &&
    typeof (value as { template?: unknown }).template === "string"
  ) {
    return (value as { template: string }).template;
  }
  return null;
}

function toDto(template: string, updatedAt?: string): MemberInvitationTemplateDTO {
  return {
    template,
    allowedPlaceholders: [...MEMBER_INVITATION_ALLOWED_PLACEHOLDERS],
    updatedAt,
  };
}

export class SupabaseSettingsRepository implements SettingsRepository {
  async getMemberInvitationTemplate(): Promise<MemberInvitationTemplateDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("namespace", "member_invitation")
      .eq("key", "whatsapp_template")
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as InvitationSettingRow;
    const template = parseTemplate(row.value);
    return template ? toDto(template, row.updated_at) : null;
  }

  async updateMemberInvitationTemplate(
    template: string,
    actor: ActorContext
  ): Promise<MemberInvitationTemplateDTO> {
    if (!actor.adminId) throw permissionError("Admin access required.");

    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc(
      "admin_update_member_invitation_template",
      {
        p_template: template,
        p_actor_admin_id: actor.adminId,
        p_actor_name: actor.actorName ?? null,
        p_ip: actor.ip ?? null,
        p_device: actor.device ?? null,
      }
    );

    if (error) {
      if (error.code === "42501") {
        throw permissionError("Settings update permission required.");
      }
      if (error.code === "22023") {
        throw validationError("Invalid invitation message.", "template");
      }
      throw error;
    }

    const row = (Array.isArray(data) ? data[0] : data) as InvitationSettingRpcRow | null;
    if (!row?.template) throw new Error("Invitation template was not returned after update.");
    return toDto(row.template, row.updated_at);
  }
}
