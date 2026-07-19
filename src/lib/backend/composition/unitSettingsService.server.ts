import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseUnitSettingsRepository } from "../adapters/supabase/repositories/supabaseUnitSettingsRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createUnitSettingsService } from "../services/unitSettingsService";

export function getUnitSettingsService() {
  const adminRepository = new SupabaseAdminRepository();
  return createUnitSettingsService({
    repository: new SupabaseUnitSettingsRepository(),
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
