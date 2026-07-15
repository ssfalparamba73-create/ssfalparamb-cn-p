import type { AdminAuthService, AdminRepository } from "../contracts/admin.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { AdminUserDTO } from "../dto/admin.dto";
import { authError, permissionError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { ERROR_CODES } from "../errors/errorCodes";

export function createAdminAuthService(deps: {
  adminRepository: AdminRepository;
}): AdminAuthService {
  const { adminRepository } = deps;

  function requireAdminId(actor: ActorContext): BackendResult<string> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin session required."));
    }
    return ok(actor.adminId);
  }

  return {
    async getCurrentAdmin(actor: ActorContext): Promise<BackendResult<AdminUserDTO>> {
      try {
        const adminIdCheck = requireAdminId(actor);
        if (!adminIdCheck.ok) return fail(adminIdCheck.error!);

        const admin = await adminRepository.findAdminById(adminIdCheck.data!);
        if (!admin || admin.status !== "active") {
          return fail(authError("Admin not found or inactive.", ERROR_CODES.ADMIN_NOT_FOUND));
        }

        return ok(admin);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async requirePermission(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
      try {
        const adminIdCheck = requireAdminId(actor);
        if (!adminIdCheck.ok) return fail(adminIdCheck.error!);

        const permissions = await adminRepository.getAdminPermissions(adminIdCheck.data!);
        if (!permissions.includes(permission) && !permissions.includes("super_admin")) {
          return fail(permissionError(`Permission denied: requires ${permission}`, ERROR_CODES.ADMIN_PERMISSION_DENIED));
        }

        return ok(true);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
