import type {
  AdminLoginInput,
  AdminUserFilters,
  AuditLogFilters,
  PromoteMemberToAdminInput,
  UpdateAdminUserAccessInput,
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
const adminRoles = [
  "super_admin",
  "president",
  "secretary",
  "treasurer",
  "collector",
  "viewer",
] as const;
const auditSeverities = ["info", "warning", "error", "critical"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function validateAdminId(input: unknown, field = "id"): BackendResult<string> {
  if (typeof input !== "string" || !uuidPattern.test(input)) {
    return fail(validationError("Invalid admin ID.", field));
  }
  return ok(input);
}

export function validateAdminCandidateSearch(input: unknown): BackendResult<string> {
  if (typeof input !== "string") {
    return fail(validationError("Member search is required.", "search"));
  }
  const search = input.trim();
  if (search.length < 2 || search.length > 100) {
    return fail(validationError("Enter 2 to 100 characters to search members.", "search"));
  }
  return ok(search);
}

export function validatePromoteMemberToAdminInput(
  input: unknown
): BackendResult<PromoteMemberToAdminInput> {
  if (!isRecord(input)) {
    return fail(validationError("Invalid admin promotion input."));
  }
  const memberId = validateAdminId(input.memberId, "memberId");
  if (!memberId.ok) return fail(memberId.error!);
  if (typeof input.role !== "string" || !includesValue(adminRoles, input.role)) {
    return fail(validationError("Invalid admin role.", "role"));
  }
  if (typeof input.status !== "string" || !includesValue(adminStatuses, input.status)) {
    return fail(validationError("Invalid admin status.", "status"));
  }
  return ok({ memberId: memberId.data!, role: input.role, status: input.status });
}

export function validateUpdateAdminUserAccessInput(
  input: unknown
): BackendResult<UpdateAdminUserAccessInput> {
  if (!isRecord(input)) {
    return fail(validationError("Invalid admin update input."));
  }
  if (typeof input.role !== "string" || !includesValue(adminRoles, input.role)) {
    return fail(validationError("Invalid admin role.", "role"));
  }
  if (typeof input.status !== "string" || !includesValue(adminStatuses, input.status)) {
    return fail(validationError("Invalid admin status.", "status"));
  }
  return ok({ role: input.role, status: input.status });
}

export function validateAdminLoginInput(input: Partial<AdminLoginInput>): BackendResult<AdminLoginInput> {
  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);

  if (typeof input.pinOrOtp !== "string" || !/^\d{4,8}$/.test(input.pinOrOtp)) {
    return fail(validationError("Invalid login code format.", "pinOrOtp"));
  }

  return ok({
    phone: phone.data!,
    pinOrOtp: input.pinOrOtp,
  });
}

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

  if (input.role && !includesValue(adminRoles, input.role)) {
    return fail(validationError("Invalid admin role filter.", "role"));
  }

  const search = input.search?.trim();
  if (search && search.length > 100) {
    return fail(validationError("Admin search cannot exceed 100 characters.", "search"));
  }

  return ok({
    search: search || undefined,
    role: input.role,
    status: input.status,
  });
}

export function validateAuditLogFilters(input: AuditLogFilters): BackendResult<AuditLogFilters> {
  if (input.severity && !includesValue(auditSeverities, input.severity)) {
    return fail(validationError("Invalid audit severity filter.", "severity"));
  }

  const dateRange = validateDateRange({ from: input.from, to: input.to });
  if (!dateRange.ok) return fail(dateRange.error!);

  return ok(input);
}
