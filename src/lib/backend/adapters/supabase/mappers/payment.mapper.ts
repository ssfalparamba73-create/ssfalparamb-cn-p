import type {
  PaymentDTO,
  ReceiptDTO,
  CashEntryDTO,
  MemberPaymentHistoryItemDTO,
} from "../../../dto/payment.dto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToPaymentDTO(row: any, monthsRows: any[] = []): PaymentDTO {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    memberId: row.member_id,
    payerName: row.payer_name,
    payerPhone: row.payer_phone,
    category: row.category,
    method: row.method,
    amount: Number(row.amount),
    currency: "INR",
    status: row.status,
    months: monthsRows.map((m) => ({
      id: m.id,
      monthKey: m.month_key,
      label: m.label,
      amount: Number(m.amount),
    })),
    tier: row.tier,
    eventId: row.event_id,
    eventName: row.event_name,
    collectedByAdminId: row.collected_by_admin_id,
    collectedByAdminName: row.collected_by_admin_name,
    recordedByAdminId: row.recorded_by_admin_id,
    verifiedByAdminId: row.verified_by_admin_id,
    referenceId: row.reference_id,
    notes: row.notes,
    paidAt: row.paid_at,
    recordedAt: row.recorded_at,
    verifiedAt: row.verified_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToReceiptDTO(row: any, paymentRow: any = {}): ReceiptDTO {
  const monthsRows = paymentRow.payment_months || [];
  const monthLabels = monthsRows.map((m: { label?: string }) => m.label).filter(Boolean);

  return {
    receiptId: row.receipt_id,
    paymentId: row.payment_id,
    payerName: row.payer_name || paymentRow.payer_name,
    payerPhone: row.payer_phone || paymentRow.payer_phone,
    amount: Number(row.amount || paymentRow.amount),
    currency: "INR",
    category: row.category || paymentRow.category,
    method: row.method || paymentRow.method,
    status: paymentRow.status, // DO NOT default to "confirmed", preserve real status
    eventName: row.event_name || paymentRow.event_name,
    months: monthLabels.length > 0 ? monthLabels : row.months,
    receivedBy: row.received_by || paymentRow.collected_by_admin_name,
    paidAt: paymentRow.paid_at,
    issuedAt: row.issued_at || row.created_at,
    receiptTheme: row.receipt_theme || "default",
    backgroundUrl: undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToCashEntryDTO(row: any): CashEntryDTO {
  return {
    id: row.id,
    paymentId: row.payment_id,
    memberId: row.member_id,
    payerName: row.payer_name,
    payerPhone: row.payer_phone,
    amount: Number(row.amount),
    category: row.category,
    eventId: row.event_id,
    months: row.months,
    receivedByAdminId: row.received_by_admin_id,
    receivedByAdminName: row.received_by_admin_name,
    status: row.status,
    receivedAt: row.received_at,
    recordedAt: row.recorded_at,
    verifiedAt: row.verified_at,
    notes: row.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToMemberPaymentHistoryItemDTO(row: any): MemberPaymentHistoryItemDTO {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    date: row.paid_at || row.created_at,
    amount: Number(row.amount),
    method: row.method,
    status: row.status === "confirmed" ? "COMPLETED" : row.status === "pending" ? "PENDING" : row.status === "cancelled" || row.status === "rejected" ? "CANCELLED" : "FAILED",
    receiptUrl: undefined,
  };
}
