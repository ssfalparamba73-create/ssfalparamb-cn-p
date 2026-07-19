import type { BackendResult } from "../contracts/common.contract";
import type { UpdateUnitSettingsInput } from "../contracts/unitSettings.contract";
import { validationError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { validateRequiredString } from "./commonSchemas";

function requiredLimitedString(
  value: unknown,
  field: keyof UpdateUnitSettingsInput,
  label: string,
  maxLength: number
): BackendResult<string> {
  const result = validateRequiredString(value, field, label);
  if (!result.ok) return fail(result.error!);
  if (result.data!.length > maxLength) {
    return fail(validationError(`${label} is too long.`, field));
  }
  return ok(result.data!);
}

function optionalLimitedString(
  value: unknown,
  field: keyof UpdateUnitSettingsInput,
  label: string,
  maxLength: number
): BackendResult<string> {
  if (value === undefined || value === null || value === "") return ok("");
  if (typeof value !== "string") {
    return fail(validationError(`${label} must be text.`, field));
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return fail(validationError(`${label} is too long.`, field));
  }
  return ok(trimmed);
}

export function validateUpdateUnitSettingsInput(
  input: Partial<UpdateUnitSettingsInput>
): BackendResult<UpdateUnitSettingsInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Unit settings input must be an object."));
  }

  const unitName = requiredLimitedString(input.unitName, "unitName", "Unit name", 120);
  if (!unitName.ok) return fail(unitName.error!);
  const branchSector = optionalLimitedString(input.branchSector, "branchSector", "Branch / Sector", 120);
  if (!branchSector.ok) return fail(branchSector.error!);
  const address = optionalLimitedString(input.address, "address", "Address", 300);
  if (!address.ok) return fail(address.error!);
  const cityDistrict = optionalLimitedString(input.cityDistrict, "cityDistrict", "City / District", 120);
  if (!cityDistrict.ok) return fail(cityDistrict.error!);

  const email = optionalLimitedString(input.officialEmail, "officialEmail", "Official email", 254);
  if (!email.ok) return fail(email.error!);
  if (email.data && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.data)) {
    return fail(validationError("Please enter a valid official email address.", "officialEmail"));
  }

  const pinCode = optionalLimitedString(input.pinCode, "pinCode", "PIN code", 6);
  if (!pinCode.ok) return fail(pinCode.error!);
  if (pinCode.data && !/^\d{6}$/.test(pinCode.data)) {
    return fail(validationError("PIN code must contain exactly 6 digits.", "pinCode"));
  }

  return ok({
    unitName: unitName.data!,
    branchSector: branchSector.data!,
    officialEmail: email.data!,
    address: address.data!,
    cityDistrict: cityDistrict.data!,
    pinCode: pinCode.data!,
  });
}
