import { randomInt } from "node:crypto";
import type {
  AdminRepository,
  AdminUserFilters,
  AdminUserService,
  PromoteMemberToAdminInput,
  UpdateAdminUserAccessInput,
} from "../contracts/admin.contract";
import type { ActorContext, BackendResult, PaginationInput } from "../contracts/common.contract";
import { authError, notFoundError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";
import { validatePagination } from "../validation/commonSchemas";
import {
  validateAdminCandidateSearch,
  validateAdminId,
  validateAdminUserFilters,
  validatePromoteMemberToAdminInput,
  validateUpdateAdminUserAccessInput,
} from "../validation/adminSchemas";

export function createAdminUserService(deps: {
  repository: AdminRepository;
  requirePermission: (actor: ActorContext, permission: string) => Promise<BackendResult<true>>;
}): AdminUserService {
  async function access(actor: ActorContext) {
    if (actor.actorType !== "admin" || !actor.adminId) return fail(authError("Admin access required."));
    return deps.requirePermission(actor, "admin_users.manage");
  }

  const code = () => randomInt(0, 10_000).toString().padStart(4, "0");

  return {
    async listAdmins(filters: AdminUserFilters, pagination: PaginationInput, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const validFilters = validateAdminUserFilters(filters); if (!validFilters.ok) return fail(validFilters.error!);
        const validPage = validatePagination(pagination);
        return ok(await deps.repository.listAdmins(validFilters.data!, validPage));
      } catch (error) { return fail(fromThrowable(error)); }
    },

    async searchMemberCandidates(search: string, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const valid = validateAdminCandidateSearch(search); if (!valid.ok) return fail(valid.error!);
        return ok(await deps.repository.searchMemberCandidates(valid.data!, 20));
      } catch (error) { return fail(fromThrowable(error)); }
    },

    async promoteMember(input: PromoteMemberToAdminInput, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const valid = validatePromoteMemberToAdminInput(input); if (!valid.ok) return fail(valid.error!);
        const rawCode = code();
        const result = await deps.repository.promoteMember(valid.data!, rawCode, actor);
        const admin = await deps.repository.findAdminById(result.adminId);
        if (!admin) return fail(notFoundError("Admin was not found after creation.", ERROR_CODES.ADMIN_NOT_FOUND));
        return ok({ admin, code: rawCode, issuedAt: result.issuedAt });
      } catch (error) { return fail(fromThrowable(error)); }
    },

    async updateAdminAccess(adminId: string, input: UpdateAdminUserAccessInput, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const validId = validateAdminId(adminId); if (!validId.ok) return fail(validId.error!);
        const valid = validateUpdateAdminUserAccessInput(input); if (!valid.ok) return fail(valid.error!);
        await deps.repository.updateAdminAccess(validId.data!, valid.data!, actor);
        const admin = await deps.repository.findAdminById(validId.data!);
        return admin ? ok(admin) : fail(notFoundError("Admin not found.", ERROR_CODES.ADMIN_NOT_FOUND));
      } catch (error) { return fail(fromThrowable(error)); }
    },

    async resetAdminCode(adminId: string, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const validId = validateAdminId(adminId); if (!validId.ok) return fail(validId.error!);
        const rawCode = code();
        const result = await deps.repository.resetAdminCode(validId.data!, rawCode, actor);
        const admin = await deps.repository.findAdminById(result.adminId);
        if (!admin) return fail(notFoundError("Admin not found.", ERROR_CODES.ADMIN_NOT_FOUND));
        return ok({ admin, code: rawCode, issuedAt: result.issuedAt });
      } catch (error) { return fail(fromThrowable(error)); }
    },

    async softDeactivateAdmin(adminId: string, actor: ActorContext) {
      try {
        const allowed = await access(actor); if (!allowed.ok) return fail(allowed.error!);
        const validId = validateAdminId(adminId); if (!validId.ok) return fail(validId.error!);
        await deps.repository.softDeactivateAdmin(validId.data!, actor);
        return ok(undefined);
      } catch (error) { return fail(fromThrowable(error)); }
    },
  };
}
