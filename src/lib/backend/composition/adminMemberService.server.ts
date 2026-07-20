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
  const deploymentHost =
    process.env.APP_BASE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  const memberLoginUrl = `${deploymentHost.replace(/\/+$/, "")}/login`;

  return createAdminMemberService({
    memberRepository: new SupabaseMemberRepository(),
    memberLoginUrl,
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
