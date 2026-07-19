import type { ISODateTime } from "../contracts/common.contract";

export interface MemberInvitationTemplateDTO {
  template: string;
  allowedPlaceholders: string[];
  updatedAt?: ISODateTime;
}

export interface UpdateMemberInvitationTemplateInput {
  template: string;
}
