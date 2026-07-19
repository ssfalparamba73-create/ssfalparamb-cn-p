export const MEMBER_INVITATION_DEFAULT_TEMPLATE =
  "SSF Alparamba member login: Phone {phone}, PIN {pin}";

export const MEMBER_INVITATION_ALLOWED_PLACEHOLDERS = [
  "{name}",
  "{phone}",
  "{pin}",
] as const;

export const MEMBER_INVITATION_TEMPLATE_MAX_LENGTH = 1000;

export interface MemberInvitationTemplateValues {
  name: string;
  phone: string;
  pin: string;
}

export function renderMemberInvitationTemplate(
  template: string,
  values: MemberInvitationTemplateValues
): string {
  return template
    .split("{name}").join(values.name)
    .split("{phone}").join(values.phone)
    .split("{pin}").join(values.pin);
}
