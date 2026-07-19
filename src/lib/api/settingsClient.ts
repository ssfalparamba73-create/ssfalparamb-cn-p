import type {
  MemberInvitationTemplateDTO,
  UpdateMemberInvitationTemplateInput,
} from "@/lib/backend/dto/settings.dto";
import type { UpdateUnitSettingsInput } from "@/lib/backend/contracts/unitSettings.contract";
import type { UnitSettingsDTO } from "@/lib/backend/dto/unitSettings.dto";
import { requestBackend } from "./backendClient";

const MEMBER_INVITATION_SETTINGS_PATH =
  "/api/v1/admin/settings/member-invitation";

export function getMemberInvitationTemplate(): Promise<MemberInvitationTemplateDTO> {
  return requestBackend<MemberInvitationTemplateDTO>(
    MEMBER_INVITATION_SETTINGS_PATH
  );
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
