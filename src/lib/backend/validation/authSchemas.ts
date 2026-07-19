import type { AdminCodeLoginInput, MemberLoginInput } from "../contracts/auth.contract";
import type { BackendResult } from "../contracts/common.contract";
import { validationError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { validatePhone } from "./commonSchemas";

export function validateMemberLoginInput(
  input: Partial<MemberLoginInput>
): BackendResult<MemberLoginInput> {
  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);

  if (typeof input.pin !== "string" || !/^\d{4}$/.test(input.pin)) {
    return fail(validationError("PIN must contain exactly 4 digits.", "pin"));
  }

  return ok({ phone: phone.data!, pin: input.pin });
}

export function validateAdminCodeLoginInput(
  input: Partial<AdminCodeLoginInput>
): BackendResult<AdminCodeLoginInput> {
  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);

  if (typeof input.code !== "string" || !/^\d{4,8}$/.test(input.code)) {
    return fail(validationError("Admin code must contain 4 to 8 digits.", "code"));
  }

  return ok({ phone: phone.data!, code: input.code });
}
