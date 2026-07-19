import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseMemberRepository } from "../adapters/supabase/repositories/supabaseMemberRepository";
import { SupabaseSettingsRepository } from "../adapters/supabase/repositories/supabaseSettingsRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createAdminMemberService } from "../services/adminMemberService";

export function getAdminMemberService() {
  const adminRepository = new SupabaseAdminRepository();
  const settingsRepository = new SupabaseSettingsRepository();
  return createAdminMemberService({
    memberRepository: new SupabaseMemberRepository(),
    async getMemberInvitationTemplate() {
      return (await settingsRepository.getMemberInvitationTemplate())?.template ?? null;
    },
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
