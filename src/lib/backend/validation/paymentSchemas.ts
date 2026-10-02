import type {
  CreatePaymentIntentInput,
  PaymentStatusTransitionInput,
  RecordCashEntryInput,
} from "../contracts/payment.contract";
import type { BackendResult } from "../contracts/common.contract";
import type { PaymentFilters } from "../dto/payment.dto";
import { ERROR_CODES } from "../errors/errorCodes";
import { fail, ok } from "../errors/resultHelpers";
import { validationError } from "../errors/createBackendError";
import {
  validateDateRange,
  validatePhone,
  validatePositiveAmount,
  validateRequiredString,
  includesValue,
} from "./commonSchemas";

const paymentCategories = ["monthly_dues", "special_event"] as const;
const paymentMethods = ["upi", "qr_code", "cash_handover", "admin_cash_entry"] as const;
// Public payment intents may only be started through a payer-facing method.
// Admin cash entries use the authenticated /admin/cash-entry flow instead.
const publicIntentPaymentMethods = ["upi", "qr_code", "cash_handover"] as const;
const paymentStatuses = ["pending", "confirmed", "failed", "refunded", "cancelled", "rejected"] as const;
const monthlyTiers = ["base", "premium", "custom", "flexible"] as const;

export interface CreatePaymentIntentValidationOptions {
  specialEventMinimumAmount: number;
}

export function validateCreatePaymentIntentInput(
  input: Partial<CreatePaymentIntentInput>,
  options: CreatePaymentIntentValidationOptions
): BackendResult<CreatePaymentIntentInput> {
  const phone = validatePhone(input.payerPhone, "payerPhone");
  if (!phone.ok) return fail(phone.error!);

  if (!input.category || !includesValue(paymentCategories, input.category)) {
    return fail(validationError("Invalid payment category.", "category"));
  }

  if (!input.method || !includesValue(publicIntentPaymentMethods, input.method)) {
    return fail(validationError("Invalid payment method.", "method"));
  }

  if (input.tier && !includesValue(monthlyTiers, input.tier)) {
    return fail(validationError("Invalid monthly tier.", "tier"));
  }

  if (input.memberQuery !== undefined && (typeof input.memberQuery !== "string" || input.memberQuery.length > 128)) {
    return fail(validationError("Member lookup value is invalid.", "memberQuery"));
  }
  if (input.payerName !== undefined && (typeof input.payerName !== "string" || input.payerName.trim().length > 120)) {
    return fail(validationError("Payer name is invalid.", "payerName"));
  }
  if (input.eventId !== undefined && (typeof input.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.eventId))) {
    return fail(validationError("Event ID is invalid.", "eventId"));
  }
  if (input.selectedMonthIds !== undefined && (
    !Array.isArray(input.selectedMonthIds) ||
    input.selectedMonthIds.length > 24 ||
    input.selectedMonthIds.some((month) => typeof month !== "string" || !month.trim() || month.length > 32) ||
    new Set(input.selectedMonthIds).size !== input.selectedMonthIds.length
  )) {
    return fail(validationError("Selected payment months are invalid.", "selectedMonthIds"));
  }
  if (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 2000)) {
    return fail(validationError("Payment notes are too long.", "notes"));
  }

  if (input.category === "monthly_dues" && (!input.selectedMonthIds || input.selectedMonthIds.length === 0)) {
    return fail(validationError("Select at least one pending month.", "selectedMonthIds", ERROR_CODES.MISSING_REQUIRED_FIELD));
  }

  if (input.category === "special_event") {
    const amount = validatePositiveAmount(input.customAmount, "customAmount", options.specialEventMinimumAmount);
    if (!amount.ok) return fail(amount.error!);
    if (amount.data! > 99_999_999.99 || !Number.isSafeInteger(Math.round(amount.data! * 100)) || Math.abs(amount.data! * 100 - Math.round(amount.data! * 100)) > 1e-7) {
      return fail(validationError("Amount must be a valid INR amount with at most two decimal places.", "customAmount", ERROR_CODES.INVALID_AMOUNT));
    }
    input.customAmount = amount.data!;
  }

  if (input.method === "cash_handover" && !input.receivedByAdminId) {
    return fail(validationError("Receiving admin is required for cash payments.", "receivedByAdminId"));
  }

  return ok({
    memberQuery: input.memberQuery,
    payerName: input.payerName,
    payerPhone: phone.data!,
    category: input.category,
    method: input.method,
    selectedMonthIds: input.selectedMonthIds,
    tier: input.tier,
    customAmount: input.customAmount,
    eventId: input.eventId,
    receivedByAdminId: input.receivedByAdminId,
    notes: input.notes,
  });
}

export interface RecordCashEntryValidationOptions {
  cashEntryMinimumAmount: number;
}

export function validateRecordCashEntryInput(
  input: Partial<RecordCashEntryInput>,
  options: RecordCashEntryValidationOptions
): BackendResult<RecordCashEntryInput> {
  if (typeof input.idempotencyKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) {
    return fail(validationError("Cash request key is invalid.", "idempotencyKey"));
  }
  if (input.memberId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.memberId)) {
    return fail(validationError("Member ID is invalid.", "memberId"));
  }
  if (!input.memberId) {
    const guestName = validateRequiredString(input.guestName, "guestName", "Guest name");
    if (!guestName.ok) return fail(guestName.error!);

    const guestPhone = validatePhone(input.guestPhone, "guestPhone");
    if (!guestPhone.ok) return fail(guestPhone.error!);

    input.guestName = guestName.data!;
    input.guestPhone = guestPhone.data!;
  }

  if (!input.category || !includesValue(paymentCategories, input.category)) {
    return fail(validationError("Invalid payment category.", "category"));
  }

  const amount = validatePositiveAmount(input.amount, "amount", options.cashEntryMinimumAmount);
  if (!amount.ok) return fail(amount.error!);
  if (amount.data! > 99_999_999.99 || !Number.isSafeInteger(Math.round(amount.data! * 100)) || Math.abs(amount.data! * 100 - Math.round(amount.data! * 100)) > 1e-7) {
    return fail(validationError("Amount must be a valid INR amount with at most two decimal places.", "amount", ERROR_CODES.INVALID_AMOUNT));
  }

  const receivedByAdminId = validateRequiredString(input.receivedByAdminId, "receivedByAdminId", "Receiving admin");
  if (!receivedByAdminId.ok) return fail(receivedByAdminId.error!);

  if (input.category === "monthly_dues" && (!input.months || input.months.length === 0)) {
    return fail(validationError("At least one month is required.", "months"));
  }
  if (input.months && (
    input.months.length > 24 ||
    input.months.some((month) => typeof month !== "string" || !month.trim() || month.length > 64) ||
    new Set(input.months).size !== input.months.length
  )) {
    return fail(validationError("Payment months are invalid.", "months"));
  }
  if (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 2000)) {
    return fail(validationError("Payment notes are too long.", "notes"));
  }

  if (input.category === "special_event" && !input.eventId) {
    return fail(validationError("Event is required.", "eventId"));
  }
  if (input.eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.eventId)) {
    return fail(validationError("Event ID is invalid.", "eventId"));
  }

  return ok({
    idempotencyKey: input.idempotencyKey,
    memberId: input.memberId,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    category: input.category,
    amount: amount.data!,
    months: input.months,
    eventId: input.eventId,
    receivedByAdminId: receivedByAdminId.data!,
    notes: input.notes,
  });
}

export function validatePaymentStatusTransitionInput(
  input: Partial<PaymentStatusTransitionInput>
): BackendResult<PaymentStatusTransitionInput> {
  const paymentId = validateRequiredString(input.paymentId, "paymentId", "Payment ID");
  if (!paymentId.ok) return fail(paymentId.error!);

  return ok({
    paymentId: paymentId.data!,
    reason: input.reason,
    notes: input.notes,
  });
}

export function validatePaymentFilters(input: PaymentFilters): BackendResult<PaymentFilters> {
  if (input.category && !includesValue(paymentCategories, input.category)) {
    return fail(validationError("Invalid payment category filter.", "category"));
  }

  if (input.method && !includesValue(paymentMethods, input.method)) {
    return fail(validationError("Invalid payment method filter.", "method"));
  }

  if (input.status && !includesValue(paymentStatuses, input.status)) {
    return fail(validationError("Invalid payment status filter.", "status"));
  }

  const dateRange = validateDateRange({ from: input.from, to: input.to });
  if (!dateRange.ok) return fail(dateRange.error!);

  return ok(input);
}

export function validateReceiptTokenInput(input: {
  receiptId?: string;
  token?: string;
}): BackendResult<{ receiptId: string; token: string }> {
  const receiptId = validateRequiredString(input.receiptId, "receiptId", "Receipt ID");
  if (!receiptId.ok) return fail(receiptId.error!);

  const token = validateRequiredString(input.token, "token", "Receipt token");
  if (!token.ok) return fail(token.error!);
  if (token.data!.length < 16 || token.data!.length > 256) {
    return fail(validationError("Receipt token is invalid.", "token"));
  }
  if (receiptId.data!.length > 128) {
    return fail(validationError("Receipt ID is invalid.", "receiptId"));
  }

  return ok({
    receiptId: receiptId.data!,
    token: token.data!,
  });
}
