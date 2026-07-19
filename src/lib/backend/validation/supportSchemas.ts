import type { BackendResult } from "../contracts/common.contract";
import type { CreateSupportContactInput, UpdateSupportContactInput } from "../contracts/support.contract";
import { validationError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { validatePhone, validateRequiredString } from "./commonSchemas";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateEmail(value: unknown): BackendResult<string | undefined> {
  if (value === undefined || value === null || value === "") return ok(undefined);
  if (typeof value !== "string") return fail(validationError("Invalid email address.", "email"));
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(validationError("Please enter a valid email address.", "email"));
  }
  return ok(email);
}

export function validateCreateSupportContactInput(
  input: Partial<CreateSupportContactInput>
): BackendResult<CreateSupportContactInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Support contact input must be an object."));
  }
  const name = validateRequiredString(input.name, "name", "Name");
  if (!name.ok) return fail(name.error!);
  if (name.data!.length > 120) return fail(validationError("Name is too long.", "name"));
  const role = validateRequiredString(input.role, "role", "Role");
  if (!role.ok) return fail(role.error!);
  if (role.data!.length > 120) return fail(validationError("Role is too long.", "role"));
  const phone = validatePhone(input.phone);
  if (!phone.ok) return fail(phone.error!);
  const email = validateEmail(input.email);
  if (!email.ok) return fail(email.error!);

  return ok({
    name: name.data!,
    role: role.data!,
    phone: phone.data!,
    email: email.data ?? undefined,
    whatsappEnabled: input.whatsappEnabled ?? true,
    isPrimary: input.isPrimary ?? false,
    isActive: input.isActive ?? true,
  });
}

export function validateUpdateSupportContactInput(
  input: UpdateSupportContactInput
): BackendResult<UpdateSupportContactInput> {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length === 0) {
    return fail(validationError("At least one support contact field is required."));
  }

  const output: UpdateSupportContactInput = {};
  if (input.name !== undefined) {
    const name = validateRequiredString(input.name, "name", "Name");
    if (!name.ok) return fail(name.error!);
    if (name.data!.length > 120) return fail(validationError("Name is too long.", "name"));
    output.name = name.data!;
  }
  if (input.role !== undefined) {
    const role = validateRequiredString(input.role, "role", "Role");
    if (!role.ok) return fail(role.error!);
    if (role.data!.length > 120) return fail(validationError("Role is too long.", "role"));
    output.role = role.data!;
  }
  if (input.phone !== undefined) {
    const phone = validatePhone(input.phone);
    if (!phone.ok) return fail(phone.error!);
    output.phone = phone.data!;
  }
  if (input.email !== undefined) {
    const email = validateEmail(input.email);
    if (!email.ok) return fail(email.error!);
    output.email = email.data ?? "";
  }
  if (input.whatsappEnabled !== undefined) output.whatsappEnabled = Boolean(input.whatsappEnabled);
  if (input.isPrimary !== undefined) output.isPrimary = Boolean(input.isPrimary);
  if (input.isActive !== undefined) output.isActive = Boolean(input.isActive);
  return ok(output);
}

export function validateSupportContactId(id: string): BackendResult<string> {
  return UUID_PATTERN.test(id)
    ? ok(id)
    : fail(validationError("Invalid support contact ID.", "id"));
}

export function validateSupportContactOrder(ids: unknown): BackendResult<string[]> {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
    return fail(validationError("Contact order must be a non-empty list.", "ids"));
  }
  if (!ids.every((id): id is string => typeof id === "string" && UUID_PATTERN.test(id))) {
    return fail(validationError("Contact order contains an invalid ID.", "ids"));
  }
  if (new Set(ids).size !== ids.length) {
    return fail(validationError("Contact order contains duplicate IDs.", "ids"));
  }
  return ok(ids);
}
