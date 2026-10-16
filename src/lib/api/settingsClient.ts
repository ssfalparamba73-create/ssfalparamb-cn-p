import type {
  MemberInvitationTemplateDTO,
  UpdateMemberInvitationTemplateInput,
} from "@/lib/backend/dto/settings.dto";
import type { UpdateUnitSettingsInput } from "@/lib/backend/contracts/unitSettings.contract";
import type { BlockOptionsDTO, UnitSettingsDTO } from "@/lib/backend/dto/unitSettings.dto";
import type { PublicBannerDTO } from "@/lib/backend/dto/publicBanner.dto";
import { requestBackend } from "./backendClient";

const MEMBER_INVITATION_SETTINGS_PATH =
  "/api/v1/admin/settings/member-invitation";

export function getMemberInvitationTemplate(): Promise<MemberInvitationTemplateDTO> {
  return requestBackend<MemberInvitationTemplateDTO>(
    MEMBER_INVITATION_SETTINGS_PATH
  );
}

export function getPublicBlockOptions(): Promise<BlockOptionsDTO> {
  return requestBackend<BlockOptionsDTO>("/api/v1/settings/blocks");
}

export function getPublicBanner(): Promise<PublicBannerDTO> {
  return requestBackend<PublicBannerDTO>("/api/v1/settings/public-banner");
}

export function getAdminPublicBanner(): Promise<PublicBannerDTO> {
  return requestBackend<PublicBannerDTO>("/api/v1/admin/settings/public-banner");
}

export function uploadPublicBanner(file: File): Promise<PublicBannerDTO> {
  const body = new FormData();
  body.set("file", file);
  return requestBackend<PublicBannerDTO>("/api/v1/admin/settings/public-banner", {
    method: "POST",
    body,
  });
}

export function getUnitSettings(): Promise<UnitSettingsDTO> {
  return requestBackend<UnitSettingsDTO>("/api/v1/admin/settings/unit");
}

export function updateUnitSettings(input: UpdateUnitSettingsInput): Promise<UnitSettingsDTO> {
  return requestBackend<UnitSettingsDTO>("/api/v1/admin/settings/unit", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateMemberInvitationTemplate(
  input: UpdateMemberInvitationTemplateInput
): Promise<MemberInvitationTemplateDTO> {
  return requestBackend<MemberInvitationTemplateDTO>(
    MEMBER_INVITATION_SETTINGS_PATH,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}
