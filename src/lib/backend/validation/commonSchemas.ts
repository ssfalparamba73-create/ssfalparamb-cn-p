import type {
  BackendResult,
  DateRangeInput,
  PaginationInput,
} from "../contracts/common.contract";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, ok } from "../errors/resultHelpers";
import { validationError } from "../errors/createBackendError";

export function normalizePhone(input: string): string {
  let value = input.replace(/\D/g, "");

  if (value.length >= 12 && value.startsWith("91")) {
    value = value.slice(2);
  }

  if (value.length >= 14 && value.startsWith("0091")) {
    value = value.slice(4);
  }

  if (value.length === 11 && value.startsWith("0")) {
    value = value.slice(1);
  }

  return value;
}

export function validatePhone(input: unknown, field = "phone"): BackendResult<string> {
  if (typeof input !== "string" || !input.trim()) {
    return fail(validationError("Phone number is required.", field, ERROR_CODES.INVALID_PHONE));
  }

  const phone = normalizePhone(input);

  if (!/^\d{7,15}$/.test(phone)) {
    return fail(validationError("Please enter a valid phone number.", field, ERROR_CODES.INVALID_PHONE));
  }

  return ok(phone);
}

export function validatePositiveAmount(
  input: unknown,
  field = "amount",
  minimum = 1
): BackendResult<number> {
  const amount = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(amount) || amount < minimum) {
    return fail(validationError(`Amount must be at least ${minimum}.`, field, ERROR_CODES.INVALID_AMOUNT));
  }

  return ok(amount);
}

export function validateRequiredString(
  input: unknown,
  field: string,
  label = field
): BackendResult<string> {
  if (typeof input !== "string" || !input.trim()) {
    return fail(validationError(`${label} is required.`, field, ERROR_CODES.MISSING_REQUIRED_FIELD));
  }

  return ok(input.trim());
}

export function validatePin(input: unknown, field = "pin"): BackendResult<string> {
  if (typeof input !== "string" || !/^\d{4}$/.test(input)) {
    return fail(validationError("PIN must be exactly 4 digits.", field));
  }

  return ok(input);
}

export function validatePagination(input: PaginationInput = {}): PaginationInput {
  const page = input.page && input.page > 0 ? Math.floor(input.page) : 1;
  const pageSize = input.pageSize && input.pageSize > 0 ? Math.min(Math.floor(input.pageSize), 100) : 20;

  return {
    page,
    pageSize,
    cursor: input.cursor,
  };
}

export function validateDateRange(input: DateRangeInput): BackendResult<DateRangeInput> {
  if (input.from && Number.isNaN(Date.parse(input.from))) {
    return fail(validationError("Invalid start date.", "from"));
  }

  if (input.to && Number.isNaN(Date.parse(input.to))) {
    return fail(validationError("Invalid end date.", "to"));
  }

  if (input.from && input.to && Date.parse(input.from) > Date.parse(input.to)) {
    return fail(validationError("Start date must be before end date.", "from"));
  }

  return ok(input);
}

export function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}
