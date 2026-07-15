import type { 
  PaymentService, 
  PaymentRepository,
  CreatePaymentIntentInput,
  RecordCashEntryInput
} from "../contracts/payment.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { PaymentIntentDTO, CashEntryDTO, MemberPaymentHistoryItemDTO } from "../dto/payment.dto";
import { authError, permissionError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { 
  validateCreatePaymentIntentInput, 
  validateRecordCashEntryInput
} from "../validation/paymentSchemas";
import { validatePagination } from "../validation/commonSchemas";

export function createPaymentService(deps: {
  paymentRepository: PaymentRepository;
  getSpecialEventMinimumAmount: (
    input: Partial<CreatePaymentIntentInput>,
    actor: ActorContext
  ) => Promise<number>;
  getCashEntryMinimumAmount: (
    actor: ActorContext
  ) => Promise<number>;
}): PaymentService {
  const { 
    paymentRepository, 
    getSpecialEventMinimumAmount, 
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
        const specialEventMinimumAmount = await getSpecialEventMinimumAmount(input, actor);
        
        const validation = validateCreatePaymentIntentInput(input, {
          specialEventMinimumAmount
        });
        if (!validation.ok) return fail(validation.error!);

        const intent = await paymentRepository.createPendingPayment(validation.data!, actor);
        
        return ok({
          paymentId: intent.id,
          receiptId: intent.receiptId,
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
