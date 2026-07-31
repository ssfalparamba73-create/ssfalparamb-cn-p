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

  if (!Array.isArray(input.areas) || input.areas.length === 0) return fail(validationError("Add at least one Block.", "areas"));
  if (input.areas.length > 50) return fail(validationError("A maximum of 50 Blocks is allowed.", "areas"));
  const areas: string[] = [];
  const normalizedAreas = new Set<string>();
  for (const value of input.areas) {
    if (typeof value !== "string" || !value.trim()) return fail(validationError("Block names cannot be empty.", "areas"));
    const area = value.trim();
    if (area.length > 80) return fail(validationError("Block names must be 80 characters or fewer.", "areas"));
    const normalized = area.toLocaleLowerCase("en-IN");
    if (normalizedAreas.has(normalized)) return fail(validationError("Block names must be unique.", "areas"));
    normalizedAreas.add(normalized);
    areas.push(area);
  }
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
    areas,
    officialEmail: email.data!,
    address: address.data!,
    cityDistrict: cityDistrict.data!,
    pinCode: pinCode.data!,
  });
}
