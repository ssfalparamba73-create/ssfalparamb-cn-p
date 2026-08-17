import "server-only";

import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { SupabasePaymentRepository } from "../adapters/supabase/repositories/supabasePaymentRepository";
import { createAdminPaymentService } from "../services/adminPaymentService";
import { fail, ok } from "../errors/resultHelpers";
import { permissionError } from "../errors/createBackendError";
import type { ActorContext } from "../contracts/common.contract";
import { SupabaseAuditRepository } from "../adapters/supabase/repositories/supabaseAuditRepository";

export function getAdminPaymentService() {
  const adminRepository = new SupabaseAdminRepository();
  return createAdminPaymentService({
    paymentRepository: new SupabasePaymentRepository(),
    auditRepository: new SupabaseAuditRepository(),
    async requirePermission(actor: ActorContext, permission: string) {
      if (!actor.adminId) return fail(permissionError("Admin access required."));
      if (actor.permissions !== undefined) {
        return actor.permissions.includes(permission)
          ? ok(true)
          : fail(permissionError(`Permission denied: requires ${permission}`));
      }
      const permissions = await adminRepository.getAdminPermissions(actor.adminId);
      return permissions.includes(permission)
        ? ok(true)
        : fail(permissionError(`Permission denied: requires ${permission}`));
    },
  });
}
