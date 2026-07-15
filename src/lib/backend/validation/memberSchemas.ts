import type {
  CreateMemberInput,
  UpdateMemberInput,
  UpdateMemberProfileInput,
} from "../contracts/member.contract";
import type { BackendResult } from "../contracts/common.contract";
import type { MemberListFilters } from "../dto/member.dto";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, ok } from "../errors/resultHelpers";
import { validationError } from "../errors/createBackendError";
import {
  validatePhone,
  validatePositiveAmount,
  validateRequiredString,
  validatePin,
  includesValue,
} from "./commonSchemas";

const memberStatuses = ["active", "inactive", "blocked", "left"] as const;
const monthlyTiers = ["base", "premium", "custom", "flexible"] as const;
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export function validateCreateMemberInput(input: Partial<CreateMemberInput>): BackendResult<CreateMemberInput> {
  const name = validateRequiredString(input.name, "name", "Name");
  if (!name.ok) return fail(name.error!);

  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);

  const amount = validatePositiveAmount(input.monthlyAmount ?? 50, "monthlyAmount", 1);
  if (!amount.ok) return fail(amount.error!);

  const tier = input.monthlyTier ?? "flexible";
  if (!includesValue(monthlyTiers, tier)) {
    return fail(validationError("Invalid monthly tier.", "monthlyTier"));
  }

  let pin: string | undefined;
  if (input.pin !== undefined) {
    const pinValidation = validatePin(input.pin);
    if (!pinValidation.ok) return fail(pinValidation.error!);
    pin = pinValidation.data!;
  }

  return ok({
    name: name.data!,
    phone: phone.data!,
    alternatePhone: input.alternatePhone,
    age: input.age,
    address: input.address,
    area: input.area,
    occupation: input.occupation,
    monthlyTier: tier,
    monthlyAmount: amount.data!,
    pin,
  });
}

export function validateUpdateMemberInput(input: UpdateMemberInput): BackendResult<UpdateMemberInput> {
  if (input.phone) {
    const phone = validatePhone(input.phone);
    if (!phone.ok) return fail(phone.error!);
    input.phone = phone.data!;
  }

  if (input.pin !== undefined) {
    const pinValidation = validatePin(input.pin);
    if (!pinValidation.ok) return fail(pinValidation.error!);
    input.pin = pinValidation.data!;
  }

  if (input.monthlyAmount !== undefined) {
    const amount = validatePositiveAmount(input.monthlyAmount, "monthlyAmount", 1);
    if (!amount.ok) return fail(amount.error!);
    input.monthlyAmount = amount.data!;
  }

  if (input.status && !includesValue(memberStatuses, input.status)) {
    return fail(validationError("Invalid member status.", "status"));
  }

  if (input.monthlyTier && !includesValue(monthlyTiers, input.monthlyTier)) {
    return fail(validationError("Invalid monthly tier.", "monthlyTier"));
  }

  if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Invalid blood group.", "bloodGroup"));
  }

  return ok(input);
}

export function validateUpdateMemberProfileInput(
  input: UpdateMemberProfileInput
): BackendResult<UpdateMemberProfileInput> {
  if (input.name !== undefined && !input.name.trim()) {
    return fail(validationError("Name cannot be empty.", "name"));
  }

  if (input.whatsapp) {
    const whatsapp = validatePhone(input.whatsapp, "whatsapp");
    if (!whatsapp.ok) return fail(whatsapp.error!);
    input.whatsapp = whatsapp.data!;
  }

  return ok(input);
}

export function validateMemberListFilters(input: MemberListFilters): BackendResult<MemberListFilters> {
  if (input.status && !includesValue(memberStatuses, input.status)) {
    return fail(validationError("Invalid member status filter.", "status"));
  }

  if (input.monthlyTier && !includesValue(monthlyTiers, input.monthlyTier)) {
    return fail(validationError("Invalid monthly tier filter.", "monthlyTier"));
  }

  if (input.bloodGroup && !includesValue(bloodGroups, input.bloodGroup)) {
    return fail(validationError("Invalid blood group filter.", "bloodGroup"));
  }

  return ok(input);
}
