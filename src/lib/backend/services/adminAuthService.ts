import type { AdminAuthService, AdminRepository, AdminLoginInput } from "../contracts/admin.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { AdminSessionDTO, AdminUserDTO } from "../dto/admin.dto";
import { authError, permissionError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { validateAdminLoginInput } from "../validation/adminSchemas";
import { ERROR_CODES } from "../errors/errorCodes";

export function createAdminAuthService(deps: {
  adminRepository: AdminRepository;
  verifyAdminCredential: (
    input: AdminLoginInput,
    admin: AdminUserDTO
  ) => Promise<boolean>;
}): AdminAuthService {
  const { adminRepository, verifyAdminCredential } = deps;

  function requireAdminId(actor: ActorContext): BackendResult<string> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin session required."));
    }
    return ok(actor.adminId);
  }

  return {
    async login(input: AdminLoginInput, actor: ActorContext): Promise<BackendResult<AdminSessionDTO>> {
      try {
        const validation = validateAdminLoginInput(input);
        if (!validation.ok) return fail(validation.error!);

        const admin = await adminRepository.findAdminByPhone(validation.data!.phone);
        if (!admin || admin.status !== "active") {
          return fail(authError("Invalid admin credentials or account disabled.", ERROR_CODES.ADMIN_NOT_FOUND));
        }

        const isValid = await verifyAdminCredential(validation.data!, admin);
        if (!isValid) {
          return fail(authError("Invalid login credentials.", ERROR_CODES.INVALID_PIN));
        }

        return ok({ admin });
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

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
