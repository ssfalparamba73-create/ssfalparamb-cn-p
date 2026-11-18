import type { DashboardRepository, DashboardService } from "../contracts/dashboard.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import { notFoundError, permissionError, validationError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";

export function createDashboardService(deps: {
  dashboardRepository: DashboardRepository;
  requireAdminPermission: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): DashboardService {
  const { dashboardRepository, requireAdminPermission } = deps;

  return {
    async getAdminDashboard(actor, monthKey) {
      try {
        if (actor.actorType !== "admin" || !actor.adminId) {
          return fail(permissionError("Admin access required."));
        }

        const permission = await requireAdminPermission(actor, "dashboard.view");
        if (!permission.ok) return fail(permission.error!);
        const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
        if (!monthMatch || Number(monthMatch[1]) < 1) {
          return fail(validationError("A valid dashboard month is required.", "month"));
        }
        return ok(await dashboardRepository.getAdminDashboard(monthKey));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async getMemberDashboard(actor) {
      try {
        if (actor.actorType !== "member" || !actor.memberId) {
          return fail(permissionError("Member access required."));
        }

        const dashboard = await dashboardRepository.getMemberDashboard(actor.memberId);
        if (!dashboard) {
          return fail(notFoundError("Member dashboard not found.", ERROR_CODES.MEMBER_NOT_FOUND));
        }
        return ok(dashboard);
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
