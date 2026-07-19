import type { BackendResult } from "../contracts/common.contract";
import type { UpdateMemberInvitationTemplateInput } from "../dto/settings.dto";
import { validationError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import {
  MEMBER_INVITATION_ALLOWED_PLACEHOLDERS,
  MEMBER_INVITATION_TEMPLATE_MAX_LENGTH,
} from "@/lib/memberInvitation";

export function validateMemberInvitationTemplateInput(
  input: unknown
): BackendResult<UpdateMemberInvitationTemplateInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Invitation template input must be an object."));
  }

  const template = (input as { template?: unknown }).template;
  if (typeof template !== "string" || !template.trim()) {
    return fail(validationError("Invitation message is required.", "template"));
  }
  if (template.length > MEMBER_INVITATION_TEMPLATE_MAX_LENGTH) {
    return fail(
      validationError(
        `Invitation message must be ${MEMBER_INVITATION_TEMPLATE_MAX_LENGTH} characters or fewer.`,
        "template"
      )
    );
  }
  if (template.includes("\0")) {
    return fail(validationError("Invitation message contains an invalid character.", "template"));
  }
  if (!template.includes("{phone}") || !template.includes("{pin}")) {
    return fail(
      validationError(
        "Invitation message must include both {phone} and {pin}.",
        "template"
      )
    );
  }

  const withoutSupportedPlaceholders = MEMBER_INVITATION_ALLOWED_PLACEHOLDERS.reduce(
    (message, placeholder) => message.split(placeholder).join(""),
    template
  );
  if (/[{}]/.test(withoutSupportedPlaceholders)) {
    return fail(
      validationError(
        "Invitation message contains an unsupported or malformed placeholder.",
        "template"
      )
    );
  }

  return ok({ template });
}
