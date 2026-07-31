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
  "areas",
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

const DEFAULT_AREAS = ["Alparamba Center", "North Gate", "South Block"];

function stringArrayValue(value: unknown): string[] {
  const areas = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  return areas.length > 0 ? areas : DEFAULT_AREAS;
}

function mapSettings(rows: SettingRow[]): UnitSettingsDTO {
  const values = new Map(rows.map((row) => [row.key, stringValue(row.value)]));
  return {
    unitName: values.get("name") ?? "",
    branchSector: values.get("branch_sector") ?? "",
    areas: stringArrayValue(rows.find((row) => row.key === "areas")?.value),
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
    areas: input.areas,
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
    const databaseInput = toDatabaseInput(input);
    const params = {
      p_input: databaseInput,
      ...actorParams(actor),
    };
    const { error } = await supabase.rpc("admin_update_unit_settings", params);
    if (error) {
      const isPreBlocksFunction =
        error.code === "22023" &&
        error.message.toLowerCase().includes("unknown unit setting key");
      if (!isPreBlocksFunction) throw error;

      const legacyInput = Object.fromEntries(
        Object.entries(databaseInput).filter(([key]) => key !== "areas")
      );
      const { error: legacyError } = await supabase.rpc("admin_update_unit_settings", {
        ...params,
        p_input: legacyInput,
      });
      if (legacyError) throw legacyError;

      const { error: blocksError } = await supabase
        .from("app_settings")
        .upsert({
          namespace: "unit",
          key: "areas",
          value: input.areas,
          description: "Ordered Block options used by member forms and filters",
          is_public: true,
          updated_by_admin_id: actor.adminId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "namespace,key" });
      if (blocksError) throw blocksError;
    }
    return this.getUnitSettings();
  }
}
