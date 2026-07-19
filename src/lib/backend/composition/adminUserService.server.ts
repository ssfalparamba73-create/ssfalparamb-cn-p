import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createAdminUserService } from "../services/adminUserService";

export function getAdminUserService() {
  const repository = new SupabaseAdminRepository();
  return createAdminUserService({
    repository,
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await repository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
