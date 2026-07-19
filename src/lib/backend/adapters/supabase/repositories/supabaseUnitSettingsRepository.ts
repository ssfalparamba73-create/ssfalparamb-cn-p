import type { ActorContext } from "../../../contracts/common.contract";
import type {
  UnitSettingsRepository,
  UpdateUnitSettingsInput,
} from "../../../contracts/unitSettings.contract";
import type { UnitSettingsDTO } from "../../../dto/unitSettings.dto";
import { createSupabaseBackendClient } from "../client";

const settingKeys = [
  "name",
  "branch_sector",
  "official_email",
  "address",
  "city_district",
  "pin_code",
] as const;

interface SettingRow {
  key: string;
  value: unknown;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mapSettings(rows: SettingRow[]): UnitSettingsDTO {
  const values = new Map(rows.map((row) => [row.key, stringValue(row.value)]));
  return {
    unitName: values.get("name") ?? "",
    branchSector: values.get("branch_sector") ?? "",
    officialEmail: values.get("official_email") ?? "",
    address: values.get("address") ?? "",
    cityDistrict: values.get("city_district") ?? "",
    pinCode: values.get("pin_code") ?? "",
  };
}

function toDatabaseInput(input: UpdateUnitSettingsInput) {
  return {
    name: input.unitName,
    branch_sector: input.branchSector,
    official_email: input.officialEmail,
    address: input.address,
    city_district: input.cityDistrict,
    pin_code: input.pinCode,
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

export class SupabaseUnitSettingsRepository implements UnitSettingsRepository {
  async getUnitSettings(): Promise<UnitSettingsDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("namespace", "unit")
      .in("key", [...settingKeys]);
    if (error) throw error;
    return mapSettings((data || []) as SettingRow[]);
  }

  async updateUnitSettings(input: UpdateUnitSettingsInput, actor: ActorContext): Promise<UnitSettingsDTO> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_update_unit_settings", {
      p_input: toDatabaseInput(input),
      ...actorParams(actor),
    });
    if (error) throw error;
    return this.getUnitSettings();
  }
}
