import type {
  
  AdminUserFilters,
  AuditLogFilters,
} from "../contracts/admin.contract";
import type { BackendResult } from "../contracts/common.contract";
import { fail, ok } from "../errors/resultHelpers";
import { validationError } from "../errors/createBackendError";
import {
  validateDateRange,
  validatePhone,
  validateRequiredString,
  includesValue,
} from "./commonSchemas";

const adminStatuses = ["active", "inactive"] as const;
const auditSeverities = ["info", "warning", "error", "critical"] as const;


export function validatePermissionCode(input: unknown): BackendResult<string> {
  const permission = validateRequiredString(input, "permission", "Permission");
  if (!permission.ok) return fail(permission.error!);

  if (!/^[a-z]+(\.[a-z_]+)+$/.test(permission.data!)) {
    return fail(validationError("Invalid permission code.", "permission"));
  }

  return ok(permission.data!);
}

export function validateAdminUserFilters(input: AdminUserFilters): BackendResult<AdminUserFilters> {
  if (input.status && !includesValue(adminStatuses, input.status)) {
    return fail(validationError("Invalid admin status filter.", "status"));
  }

  return ok(input);
}

export function validateAuditLogFilters(input: AuditLogFilters): BackendResult<AuditLogFilters> {
  if (input.severity && !includesValue(auditSeverities, input.severity)) {
    return fail(validationError("Invalid audit severity filter.", "severity"));
  }

  const dateRange = validateDateRange({ from: input.from, to: input.to });
  if (!dateRange.ok) return fail(dateRange.error!);

  return ok(input);
}
