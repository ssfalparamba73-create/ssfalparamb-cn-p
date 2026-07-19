import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseSettingsRepository } from "../adapters/supabase/repositories/supabaseSettingsRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createSettingsService } from "../services/settingsService";

export function getSettingsService() {
  const adminRepository = new SupabaseAdminRepository();
  return createSettingsService({
    settingsRepository: new SupabaseSettingsRepository(),
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
