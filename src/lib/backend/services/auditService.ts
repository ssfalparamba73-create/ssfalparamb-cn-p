import type { AuditService, AuditRepository, AuditLogFilters } from "../contracts/admin.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { AuditLogDTO } from "../dto/admin.dto";
import { fail, ok, fromThrowable } from "../errors/resultHelpers";
import { authError } from "../errors/createBackendError";
import { validateAuditLogFilters } from "../validation/adminSchemas";
import { validatePagination } from "../validation/commonSchemas";

export function createAuditService(deps: {
  auditRepository: AuditRepository;
  requirePermission: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): AuditService {
  const { auditRepository, requirePermission } = deps;

  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" && actor.actorType !== "system") {
      return fail(authError("System or Admin access required."));
    }
    if (actor.actorType === "admin") {
      return await requirePermission(actor, permission);
    }
    return ok(true);
  }

  return {
    async listAuditLogs(
      filters: AuditLogFilters,
      pagination: PaginationInput,
      actor: ActorContext
    ): Promise<BackendResult<PaginatedResult<AuditLogDTO>>> {
      try {
        const accessCheck = await checkAccess(actor, "audit.view");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const filterValidation = validateAuditLogFilters(filters);
        if (!filterValidation.ok) return fail(filterValidation.error!);

        const validPagination = validatePagination(pagination);

        const result = await auditRepository.list(filterValidation.data!, validPagination);
        return ok(result);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
