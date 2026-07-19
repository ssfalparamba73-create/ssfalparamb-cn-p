import type { ActorContext, BackendResult } from "./common.contract";
import type {
  MemberInvitationTemplateDTO,
  UpdateMemberInvitationTemplateInput,
} from "../dto/settings.dto";

export interface SettingsRepository {
  getMemberInvitationTemplate(): Promise<MemberInvitationTemplateDTO | null>;
  updateMemberInvitationTemplate(
    template: string,
    actor: ActorContext
  ): Promise<MemberInvitationTemplateDTO>;
}

export interface SettingsService {
  getMemberInvitationTemplate(
    actor: ActorContext
  ): Promise<BackendResult<MemberInvitationTemplateDTO>>;
  updateMemberInvitationTemplate(
    input: UpdateMemberInvitationTemplateInput,
    actor: ActorContext
  ): Promise<BackendResult<MemberInvitationTemplateDTO>>;
}
