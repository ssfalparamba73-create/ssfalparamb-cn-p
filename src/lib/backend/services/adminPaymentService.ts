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
import type { AuditRepository } from "../contracts/admin.contract";

export function createAdminPaymentService(deps: {
  paymentRepository: PaymentRepository;
  auditRepository?: AuditRepository;
  requirePermission?: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): AdminPaymentService {
  const { paymentRepository, requirePermission, auditRepository } = deps;

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
    },

    async voidPayment(input: PaymentStatusTransitionInput, actor: ActorContext): Promise<BackendResult<PaymentDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.void");
        if (!accessCheck.ok) return fail(accessCheck.error!);
        const validation = validatePaymentStatusTransitionInput(input);
        if (!validation.ok) return fail(validation.error!);
        const reason = validation.data!.reason?.trim();
        if (!reason) return fail(authError("A reason is required to void a payment."));
        const before = await paymentRepository.findById(validation.data!.paymentId);
        if (!before) return fail(authError("Payment not found."));
        if (before.voidedAt) return fail(authError("Payment is already voided."));
        const payment = await paymentRepository.voidPayment(validation.data!.paymentId, actor, reason);
        if (auditRepository) {
          await auditRepository.record({
            actor,
            action: "payment.voided",
            entityType: "payment",
            entityId: payment.id,
            summary: `Voided payment ${payment.receiptId} for ₹${payment.amount}`,
            severity: "warning",
            before,
            after: { ...payment, voidReason: reason },
          });
        }
        return ok(payment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
