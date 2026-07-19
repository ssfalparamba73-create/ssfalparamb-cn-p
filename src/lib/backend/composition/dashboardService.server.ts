import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseDashboardRepository } from "../adapters/supabase/repositories/supabaseDashboardRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createDashboardService } from "../services/dashboardService";

export function getDashboardService() {
  const adminRepository = new SupabaseAdminRepository();

  return createDashboardService({
    dashboardRepository: new SupabaseDashboardRepository(),
    async requireAdminPermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
