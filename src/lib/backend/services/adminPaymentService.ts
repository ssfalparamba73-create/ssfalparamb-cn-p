import type { AdminPaymentService } from "../contracts/payment.contract";
import type { PaymentRepository, PaymentStatusTransitionInput } from "../contracts/payment.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { PaymentDTO, PaymentFilters } from "../dto/payment.dto";
import { fail, ok, fromThrowable } from "../errors/resultHelpers";
import { authError } from "../errors/createBackendError";
import { 
  validatePaymentFilters, 
  validatePaymentStatusTransitionInput 
} from "../validation/paymentSchemas";
import { validatePagination } from "../validation/commonSchemas";

export function createAdminPaymentService(deps: {
  paymentRepository: PaymentRepository;
  requirePermission?: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): AdminPaymentService {
  const { paymentRepository, requirePermission } = deps;

  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    if (requirePermission) {
      return await requirePermission(actor, permission);
    }
    return ok(true);
  }

  return {
    async listPayments(
      filters: PaymentFilters, 
      pagination: PaginationInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaginatedResult<PaymentDTO>>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.view");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const filterValidation = validatePaymentFilters(filters);
        if (!filterValidation.ok) return fail(filterValidation.error!);

        const validPagination = validatePagination(pagination);

        const result = await paymentRepository.list(filterValidation.data!, validPagination);
        return ok(result);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async approvePayment(
      input: PaymentStatusTransitionInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaymentDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.verify");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validatePaymentStatusTransitionInput(input);
        if (!validation.ok) return fail(validation.error!);

        const payment = await paymentRepository.approve(validation.data!.paymentId, actor, validation.data!.notes);
        return ok(payment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async rejectPayment(
      input: PaymentStatusTransitionInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaymentDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.verify");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validatePaymentStatusTransitionInput(input);
        if (!validation.ok) return fail(validation.error!);

        const payment = await paymentRepository.reject(validation.data!.paymentId, actor, validation.data!.reason);
        return ok(payment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async cancelPayment(
      input: PaymentStatusTransitionInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaymentDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.cancel");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validatePaymentStatusTransitionInput(input);
        if (!validation.ok) return fail(validation.error!);

        const payment = await paymentRepository.cancel(validation.data!.paymentId, actor, validation.data!.reason);
        return ok(payment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
