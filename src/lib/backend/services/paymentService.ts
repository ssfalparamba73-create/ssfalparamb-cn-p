import type { 
  PaymentService, 
  PaymentRepository,
  CreatePaymentIntentInput,
  RecordCashEntryInput
} from "../contracts/payment.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { PaymentIntentDTO, CashEntryDTO, MemberPaymentHistoryItemDTO } from "../dto/payment.dto";
import { authError, permissionError, validationError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { 
  validateCreatePaymentIntentInput, 
  validateRecordCashEntryInput
} from "../validation/paymentSchemas";
import { validatePagination } from "../validation/commonSchemas";
import type { DuesFrequency } from "@/lib/payments/duesPeriod";
import { getDuesMonthKeys } from "@/lib/payments/duesPeriod";

interface PublicPaymentPolicy {
  customMinimum: number;
  duesFrequency: DuesFrequency;
  specialEventEnabled: boolean;
  upiEnabled: boolean;
}

export function createPaymentService(deps: {
  paymentRepository: PaymentRepository;
  getPublicPaymentPolicy: () => Promise<PublicPaymentPolicy>;
  getCashEntryMinimumAmount: (
    actor: ActorContext
  ) => Promise<number>;
}): PaymentService {
  const { 
    paymentRepository, 
    getPublicPaymentPolicy,
    getCashEntryMinimumAmount 
  } = deps;

  function requireAdmin(actor: ActorContext): BackendResult<true> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return ok(true);
  }

  function requireMemberOrAdmin(actor: ActorContext): BackendResult<true> {
    if (actor.actorType !== "member" && actor.actorType !== "admin") {
      return fail(authError("Access denied."));
    }
    return ok(true);
  }

  return {
    async createPaymentIntent(
      input: CreatePaymentIntentInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaymentIntentDTO>> {
      try {
        const policy = await getPublicPaymentPolicy();

        if ((input.method === "upi" || input.method === "qr_code") && !policy.upiEnabled) {
          return fail(validationError("Online payments are temporarily unavailable."));
        }
        if (input.category === "special_event" && !policy.specialEventEnabled) {
          return fail(validationError("Special event payments are not currently available."));
        }
        if (input.category === "monthly_dues") {
          const expectedMonths = getDuesMonthKeys(policy.duesFrequency).slice().sort();
          const requestedMonths = (input.selectedMonthIds ?? []).slice().sort();
          if (JSON.stringify(requestedMonths) !== JSON.stringify(expectedMonths)) {
            return fail(validationError("The selected payment period does not match the configured dues frequency.", "selectedMonthIds"));
          }
        }

        const validation = validateCreatePaymentIntentInput(input, {
          specialEventMinimumAmount: policy.customMinimum,
        });
        if (!validation.ok) return fail(validation.error!);

        const intent = await paymentRepository.createPendingPayment(validation.data!, actor);
        
        return ok({
          paymentId: intent.id,
          receiptId: intent.receiptId,
          paymentUpdatedAt: intent.updatedAt,
          status: intent.status,
          amount: intent.amount,
          currency: intent.currency,
          method: intent.method,
        });
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async recordCashEntry(
      input: RecordCashEntryInput, 
      actor: ActorContext
    ): Promise<BackendResult<CashEntryDTO>> {
      try {
        const adminCheck = requireAdmin(actor);
        if (!adminCheck.ok) return fail(adminCheck.error!);
        if (!actor.permissions?.includes("payments.record_cash")) {
          return fail(permissionError("You do not have permission to record cash payments."));
        }

        const cashEntryMinimumAmount = await getCashEntryMinimumAmount(actor);

        const validation = validateRecordCashEntryInput(input, {
          cashEntryMinimumAmount
        });
        if (!validation.ok) return fail(validation.error!);

        const entry = await paymentRepository.recordCashEntry(validation.data!, actor);
        return ok(entry);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async listMemberPayments(
      memberId: string,
      pagination: PaginationInput,
      actor: ActorContext
    ): Promise<BackendResult<PaginatedResult<MemberPaymentHistoryItemDTO>>> {
      try {
        const accessCheck = requireMemberOrAdmin(actor);
        if (!accessCheck.ok) return fail(accessCheck.error!);

        if (actor.actorType === "member" && actor.memberId !== memberId) {
          return fail(permissionError("You can only view your own payments."));
        }

        const validPagination = validatePagination(pagination);
        const result = await paymentRepository.listByMember(memberId, validPagination);
        return ok(result);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

  };
}
