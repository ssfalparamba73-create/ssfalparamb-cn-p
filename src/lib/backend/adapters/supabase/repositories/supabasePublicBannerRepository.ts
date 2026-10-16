import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { ActorContext } from "../../../contracts/common.contract";
import type { PublicBannerRepository, PublicBannerUploadInput } from "../../../contracts/publicBanner.contract";
import type { PublicBannerDTO } from "../../../dto/publicBanner.dto";
import { createSupabaseBackendClient } from "../client";

const BUCKET = "unit-assets" as const;

function extensionFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function isStoredBanner(value: unknown): value is Omit<PublicBannerDTO, "url" | "source"> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.bucket === BUCKET && typeof record.path === "string" && typeof record.mimeType === "string" && typeof record.sizeBytes === "number";
}

export class SupabasePublicBannerRepository implements PublicBannerRepository {
  async getActive(): Promise<PublicBannerDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value,updated_at")
      .eq("namespace", "public_portal")
      .eq("key", "dashboard_banner")
      .maybeSingle();
    if (error) throw error;
    if (!data || !isStoredBanner(data.value)) return null;
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(data.value.path).data.publicUrl;
    return { ...data.value, source: "storage", url: publicUrl, updatedAt: data.updated_at ?? data.value.updatedAt };
  }

  async upload(input: PublicBannerUploadInput): Promise<PublicBannerDTO> {
    const supabase = createSupabaseBackendClient();
    const path = `public-dashboard-banners/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extensionFor(input.mimeType)}`;
    const checksum = createHash("sha256").update(input.bytes).digest("hex");
    const { error } = await supabase.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: input.mimeType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return {
      source: "storage",
      bucket: BUCKET,
      path,
      url,
      mimeType: input.mimeType as PublicBannerDTO["mimeType"],
      sizeBytes: input.bytes.byteLength,
      checksum,
      updatedAt: new Date().toISOString(),
    };
  }

  async activate(banner: PublicBannerDTO, actor: ActorContext): Promise<PublicBannerDTO> {
    const supabase = createSupabaseBackendClient();
    const storedValue = {
      bucket: BUCKET,
      path: banner.path,
      mimeType: banner.mimeType,
      sizeBytes: banner.sizeBytes,
      checksum: banner.checksum,
      updatedAt: banner.updatedAt,
    };
    const { error: metadataError } = await supabase.from("storage_files").upsert({
      bucket: BUCKET,
      path: banner.path,
      mime_type: banner.mimeType,
      size: banner.sizeBytes,
      checksum: banner.checksum,
      visibility: "public",
      uploaded_by_admin_id: actor.adminId,
      metadata: { purpose: "public_dashboard_banner", originalPath: banner.path },
    }, { onConflict: "bucket,path" });
    if (metadataError) throw metadataError;
    const { error: settingError } = await supabase.from("app_settings").upsert({
      namespace: "public_portal",
      key: "dashboard_banner",
      value: storedValue,
      description: "Active member dashboard banner",
      is_public: true,
      updated_by_admin_id: actor.adminId,
      updated_at: banner.updatedAt,
    }, { onConflict: "namespace,key" });
    if (settingError) throw settingError;
    return banner;
  }

  async remove(banner: PublicBannerDTO): Promise<void> {
    if (banner.source !== "storage") return;
    const supabase = createSupabaseBackendClient();
    await supabase.storage.from(BUCKET).remove([banner.path]);
    await supabase.from("storage_files").delete().eq("bucket", BUCKET).eq("path", banner.path);
  }
}

