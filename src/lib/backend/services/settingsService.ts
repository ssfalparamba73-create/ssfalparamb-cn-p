import type { SettingsRepository, SettingsService } from "../contracts/settings.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { MemberInvitationTemplateDTO } from "../dto/settings.dto";
import { authError } from "../errors/createBackendError";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";
import { validateMemberInvitationTemplateInput } from "../validation/settingsSchemas";
import {
  MEMBER_INVITATION_ALLOWED_PLACEHOLDERS,
  MEMBER_INVITATION_DEFAULT_TEMPLATE,
} from "@/lib/memberInvitation";

export function createSettingsService(deps: {
  settingsRepository: SettingsRepository;
  requirePermission: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): SettingsService {
  const { settingsRepository, requirePermission } = deps;

  async function checkAccess(
    actor: ActorContext,
    permission: string
  ): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return requirePermission(actor, permission);
  }

  function defaultTemplate(): MemberInvitationTemplateDTO {
    return {
      template: MEMBER_INVITATION_DEFAULT_TEMPLATE,
      allowedPlaceholders: [...MEMBER_INVITATION_ALLOWED_PLACEHOLDERS],
    };
  }

  return {
    async getMemberInvitationTemplate(actor) {
      try {
        const access = await checkAccess(actor, "settings.view");
        if (!access.ok) return fail(access.error!);

        return ok(
          (await settingsRepository.getMemberInvitationTemplate()) ?? defaultTemplate()
        );
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async updateMemberInvitationTemplate(input, actor) {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);

        const validation = validateMemberInvitationTemplateInput(input);
        if (!validation.ok) return fail(validation.error!);

        return ok(
          await settingsRepository.updateMemberInvitationTemplate(
            validation.data!.template,
            actor
          )
        );
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
