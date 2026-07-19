import "server-only";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseAuditRepository } from "../adapters/supabase/repositories/supabaseAuditRepository";
import { permissionError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { createAuditService } from "../services/auditService";

export function getAuditService() {
  const adminRepository = new SupabaseAdminRepository();
  return createAuditService({
    auditRepository: new SupabaseAuditRepository(),
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
