import type { ID, ISODateTime } from "../contracts/common.contract";
import type { MonthlyTier } from "./member.dto";

export type PaymentCategory = "monthly_dues" | "special_event";
export type PaymentMethod = "upi" | "qr_code" | "cash_handover" | "admin_cash_entry";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded" | "cancelled" | "rejected";
export type CashEntryStatus = "received" | "recorded" | "verified" | "disputed";

export interface PaymentMonthDTO {
  id: ID;
  monthKey: string;
  label: string;
  amount: number;
}

export interface PaymentDTO {
  id: ID;
  receiptId: string;
  memberId?: ID;
  payerName?: string;
  payerPhone: string;
  category: PaymentCategory;
  method: PaymentMethod;
  amount: number;
  currency: "INR";
  status: PaymentStatus;
  months?: PaymentMonthDTO[];
  tier?: MonthlyTier;
  eventId?: ID;
  eventName?: string;
  collectedByAdminId?: ID;
  collectedByAdminName?: string;
  recordedByAdminId?: ID;
  verifiedByAdminId?: ID;
  referenceId?: string;
  notes?: string;
  paidAt?: ISODateTime;
  recordedAt: ISODateTime;
  verifiedAt?: ISODateTime;
}

export interface PaymentIntentDTO {
  paymentId: ID;
  receiptId?: string;
  status: PaymentStatus;
  amount: number;
  currency: "INR";
  method: PaymentMethod;
  redirectUrl?: string;
  receiptUrl?: string;
  message?: string;
}

export interface MemberPaymentHistoryItemDTO {
  id: ID;
  receiptId: string;
  date: string;
  amount: number;
  method: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  receiptUrl?: string;
}

export interface ReceiptDTO {
  receiptId: string;
  paymentId: ID;
  payerName: string;
  payerPhone: string;
  amount: number;
  currency: "INR";
  category: PaymentCategory;
  method: PaymentMethod;
  status: PaymentStatus;
  eventName?: string;
  months?: string[];
  receivedBy?: string;
  paidAt?: ISODateTime;
  issuedAt: ISODateTime;
  receiptTheme: "default" | "amber" | string;
  backgroundUrl?: string;
}

export interface CashEntryDTO {
  id: ID;
  receiptId: string;
  paymentId: ID;
  memberId?: ID;
  payerName?: string;
  payerPhone: string;
  amount: number;
  category: PaymentCategory;
  eventId?: ID;
  months?: string[];
  receivedByAdminId: ID;
  receivedByAdminName: string;
  status: CashEntryStatus;
  receivedAt: ISODateTime;
  recordedAt?: ISODateTime;
  verifiedAt?: ISODateTime;
  notes?: string;
}

export interface PaymentFilters {
  search?: string;
  memberId?: ID;
  category?: PaymentCategory;
  method?: PaymentMethod;
  status?: PaymentStatus;
  from?: ISODateTime;
  to?: ISODateTime;
}
