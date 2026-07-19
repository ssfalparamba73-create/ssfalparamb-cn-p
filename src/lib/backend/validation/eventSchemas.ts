import type { BackendResult } from "../contracts/common.contract";
import type { CreateSpecialEventInput, UpdateSpecialEventInput } from "../contracts/event.contract";
import { validationError } from "../errors/createBackendError";
import { fail, ok } from "../errors/resultHelpers";
import { includesValue, validatePositiveAmount, validateRequiredString } from "./commonSchemas";

const themes = ["default", "amber"] as const;

function normalizeOptionalText(value: unknown, field: string, maxLength: number): BackendResult<string | undefined> {
  if (value === undefined || value === null || value === "") return ok(undefined);
  if (typeof value !== "string") return fail(validationError("Invalid text value.", field));
  const normalized = value.trim();
  if (normalized.length > maxLength) return fail(validationError("Text is too long.", field));
  return ok(normalized || undefined);
}

export function validateCreateSpecialEventInput(
  input: Partial<CreateSpecialEventInput>
): BackendResult<CreateSpecialEventInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail(validationError("Event input must be an object."));
  }

  const name = validateRequiredString(input.name, "name", "Event name");
  if (!name.ok) return fail(name.error!);
  if (name.data!.length > 120) return fail(validationError("Event name is too long.", "name"));

  const minimumAmount = validatePositiveAmount(input.minimumAmount, "minimumAmount", 1);
  if (!minimumAmount.ok) return fail(minimumAmount.error!);

  const description = normalizeOptionalText(input.description, "description", 500);
  if (!description.ok) return fail(description.error!);

  let suggestedAmount: number | undefined;
  if (input.suggestedAmount !== undefined) {
    const suggested = validatePositiveAmount(input.suggestedAmount, "suggestedAmount", 1);
    if (!suggested.ok) return fail(suggested.error!);
    suggestedAmount = suggested.data!;
  }

  const receiptTheme = input.receiptTheme ?? "default";
  if (!includesValue(themes, receiptTheme)) {
    return fail(validationError("Invalid receipt theme.", "receiptTheme"));
  }

  return ok({
    name: name.data!,
    description: description.data ?? undefined,
    suggestedAmount,
    minimumAmount: minimumAmount.data!,
    receiptTheme,
    isActive: input.isActive ?? true,
  });
}

export function validateUpdateSpecialEventInput(
  input: UpdateSpecialEventInput
): BackendResult<UpdateSpecialEventInput> {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length === 0) {
    return fail(validationError("At least one event field is required."));
  }

  const merged: Partial<CreateSpecialEventInput> = {
    name: input.name ?? "unchanged",
    minimumAmount: input.minimumAmount ?? 1,
    receiptTheme: input.receiptTheme ?? "default",
    isActive: input.isActive ?? true,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.suggestedAmount !== undefined ? { suggestedAmount: input.suggestedAmount } : {}),
  };
  const validation = validateCreateSpecialEventInput(merged);
  if (!validation.ok) return fail(validation.error!);

  const output: UpdateSpecialEventInput = {};
  if (input.name !== undefined) output.name = validation.data!.name;
  if (input.description !== undefined) output.description = validation.data!.description ?? "";
  if (input.suggestedAmount !== undefined) output.suggestedAmount = validation.data!.suggestedAmount;
  if (input.minimumAmount !== undefined) output.minimumAmount = validation.data!.minimumAmount;
  if (input.receiptTheme !== undefined) output.receiptTheme = validation.data!.receiptTheme;
  if (input.isActive !== undefined) output.isActive = Boolean(input.isActive);
  return ok(output);
}

export function validateEventId(id: string): BackendResult<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return fail(validationError("Invalid event ID.", "id"));
  }
  return ok(id);
}
