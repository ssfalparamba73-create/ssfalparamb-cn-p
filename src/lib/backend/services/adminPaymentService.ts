import type { AdminPaymentService } from "../contracts/payment.contract";
import type { PaymentRepository, PaymentStatusTransitionInput } from "../contracts/payment.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { PaymentDTO, PaymentFilters } from "../dto/payment.dto";
import { fail, ok, fromThrowable } from "../errors/resultHelpers";
import { authError, validationError } from "../errors/createBackendError";
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

  async function getPendingCashHandover(paymentId: string): Promise<BackendResult<PaymentDTO>> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) return fail(validationError("Payment not found.", "paymentId"));
    if (payment.status !== "pending" || payment.method !== "cash_handover" || payment.gatewayOrderId) {
      return fail(validationError("Only a pending cash handover can be reviewed manually.", "paymentId"));
    }
    return ok(payment);
  }

  async function recordTransitionAudit(
    actor: ActorContext,
    action: "approved" | "rejected" | "cancelled" | "notes_updated",
    before: PaymentDTO,
    after: PaymentDTO,
  ) {
    if (!auditRepository) return;
    await auditRepository.record({
      actor,
      action: `payment.${action}`,
      entityType: "payment",
      entityId: after.id,
      summary: action === "notes_updated"
        ? `Updated internal notes for payment ${after.receiptId}`
        : `${action.charAt(0).toUpperCase()}${action.slice(1)} payment ${after.receiptId} for ₹${after.amount}`,
      severity: action === "rejected" || action === "cancelled" ? "warning" : "info",
      before: action === "notes_updated" ? { notes: before.notes ?? null } : before,
      after: action === "notes_updated" ? { notes: after.notes ?? null } : after,
    });
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

        const current = await getPendingCashHandover(validation.data!.paymentId);
        if (!current.ok) return fail(current.error!);

        const payment = await paymentRepository.approve(validation.data!.paymentId, actor, validation.data!.notes);
        await recordTransitionAudit(actor, "approved", current.data!, payment);
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

        const current = await getPendingCashHandover(validation.data!.paymentId);
        if (!current.ok) return fail(current.error!);

        const payment = await paymentRepository.reject(validation.data!.paymentId, actor, validation.data!.reason);
        await recordTransitionAudit(actor, "rejected", current.data!, payment);
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

        const current = await getPendingCashHandover(validation.data!.paymentId);
        if (!current.ok) return fail(current.error!);

        const payment = await paymentRepository.cancel(validation.data!.paymentId, actor, validation.data!.reason);
        await recordTransitionAudit(actor, "cancelled", current.data!, payment);
        return ok(payment);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async updatePaymentNotes(input: PaymentStatusTransitionInput, actor: ActorContext): Promise<BackendResult<PaymentDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "payments.verify");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validatePaymentStatusTransitionInput(input);
        if (!validation.ok) return fail(validation.error!);
        if (typeof validation.data!.notes !== "string" || validation.data!.notes.length > 2000) {
          return fail(validationError("Payment notes must be 2,000 characters or fewer.", "notes"));
        }

        const before = await paymentRepository.findById(validation.data!.paymentId);
        if (!before) return fail(validationError("Payment not found.", "paymentId"));
        const notes = validation.data!.notes.trim() || null;
        const payment = await paymentRepository.updateNotes(validation.data!.paymentId, notes);
        await recordTransitionAudit(actor, "notes_updated", before, payment);
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
