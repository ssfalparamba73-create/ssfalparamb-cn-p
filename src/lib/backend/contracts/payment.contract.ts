import type {
  ActorContext,
  BackendResult,
  PaginatedResult,
  PaginationInput,
} from "./common.contract";
import type {
  CashEntryDTO,
  PaymentCategory,
  PaymentDTO,
  PaymentFilters,
  PaymentIntentDTO,
  PaymentMethod,
  ReceiptDTO,
  MemberPaymentHistoryItemDTO,
} from "../dto/payment.dto";

export interface CreatePaymentIntentInput {
  memberQuery?: string;
  payerName?: string;
  payerPhone: string;
  category: PaymentCategory;
  method: PaymentMethod;
  selectedMonthIds?: string[];
  tier?: "base" | "premium" | "custom" | "flexible";
  customAmount?: number;
  eventId?: string;
  receivedByAdminId?: string;
  notes?: string;
}

export interface RecordCashEntryInput {
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  category: PaymentCategory;
  amount: number;
  months?: string[];
  eventId?: string;
  receivedByAdminId: string;
  notes?: string;
}

export interface PaymentStatusTransitionInput {
  paymentId: string;
  reason?: string;
  notes?: string;
}

export interface PaymentRepository {
  findById(id: string): Promise<PaymentDTO | null>;
  findByReceiptId(receiptId: string): Promise<PaymentDTO | null>;
  list(filters: PaymentFilters, pagination: PaginationInput): Promise<PaginatedResult<PaymentDTO>>;
  listByMember(memberId: string, pagination: PaginationInput): Promise<PaginatedResult<MemberPaymentHistoryItemDTO>>;
  createPendingPayment(input: CreatePaymentIntentInput, actor: ActorContext): Promise<PaymentDTO>;
  recordCashEntry(input: RecordCashEntryInput, actor: ActorContext): Promise<CashEntryDTO>;
  approve(paymentId: string, actor: ActorContext, notes?: string): Promise<PaymentDTO>;
  reject(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO>;
  cancel(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO>;
}

export interface ReceiptRepository {
  createForPayment(paymentId: string, actor: ActorContext): Promise<ReceiptDTO>;
  findByReceiptIdAndToken(receiptId: string, token: string): Promise<ReceiptDTO | null>;
  findForMember(paymentId: string, memberId: string): Promise<ReceiptDTO | null>;
  incrementViewCount(receiptId: string): Promise<void>;
}

export interface PaymentService {
  createPaymentIntent(input: CreatePaymentIntentInput, actor: ActorContext): Promise<BackendResult<PaymentIntentDTO>>;
  recordCashEntry(input: RecordCashEntryInput, actor: ActorContext): Promise<BackendResult<CashEntryDTO>>;
  listMemberPayments(
    memberId: string,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<MemberPaymentHistoryItemDTO>>>;
}

export interface ReceiptService {
  getReceiptByToken(receiptId: string, token: string, actor: ActorContext): Promise<BackendResult<ReceiptDTO>>;
}

export interface AdminPaymentService {
  listPayments(
    filters: PaymentFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<PaymentDTO>>>;
  approvePayment(input: PaymentStatusTransitionInput, actor: ActorContext): Promise<BackendResult<PaymentDTO>>;
  rejectPayment(input: PaymentStatusTransitionInput, actor: ActorContext): Promise<BackendResult<PaymentDTO>>;
  cancelPayment(input: PaymentStatusTransitionInput, actor: ActorContext): Promise<BackendResult<PaymentDTO>>;
}
