import { createHash } from "node:crypto";
import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type {
  ConfirmGatewayPaymentInput,
  CreatePaymentIntentInput,
  PaymentRepository,
  RecordCashEntryInput,
} from "../../../contracts/payment.contract";
import type { CashEntryDTO, MemberPaymentHistoryItemDTO, PaymentDTO, PaymentFilters } from "../../../dto/payment.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToCashEntryDTO, mapRowToMemberPaymentHistoryItemDTO, mapRowToPaymentDTO } from "../mappers/payment.mapper";

export class SupabasePaymentRepository implements PaymentRepository {
  async findById(id: string): Promise<PaymentDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").select("*, payment_months(*)").eq("id", id).single();
    if (error || !data) return null;
    return mapRowToPaymentDTO(data, data.payment_months || []);
  }

  async findByReceiptId(receiptId: string): Promise<PaymentDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").select("*, payment_months(*)").eq("receipt_id", receiptId).single();
    if (error || !data) return null;
    return mapRowToPaymentDTO(data, data.payment_months || []);
  }

  async list(filters: PaymentFilters, pagination: PaginationInput): Promise<PaginatedResult<PaymentDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase.from("payments").select("*, payment_months(*)", { count: "exact" });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.method) query = query.eq("method", filters.method);
    if (filters.category) query = query.eq("category", filters.category);
    query = query.order("recorded_at", { ascending: false });

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

    return {
      items: (data || []).map((row) => mapRowToPaymentDTO(row, row.payment_months || [])),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async listByMember(memberId: string, pagination: PaginationInput): Promise<PaginatedResult<MemberPaymentHistoryItemDTO>> {
    const supabase = createSupabaseBackendClient();
    const query = supabase.from("payments").select("*", { count: "exact" }).eq("member_id", memberId).is("voided_at", null);

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

    return {
      items: (data || []).map((row) => mapRowToMemberPaymentHistoryItemDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  private async resolveMemberDetails(
    supabase: ReturnType<typeof createSupabaseBackendClient>,
    memberQuery?: string
  ): Promise<{ id: string, name: string, phone: string } | null> {
    if (!memberQuery) return null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(memberQuery)) {
      const { data } = await supabase.from("members").select("id, name, phone").eq("id", memberQuery).maybeSingle();
      if (data) return { id: data.id, name: data.name, phone: data.phone };
    }

    const { data: byPhone } = await supabase
      .from("members")
      .select("id, name, phone")
      .eq("phone", memberQuery)
      .neq("status", "left")
      .limit(1)
      .maybeSingle();
    if (byPhone) return { id: byPhone.id, name: byPhone.name, phone: byPhone.phone };

    const { data: byCode } = await supabase.from("members").select("id, name, phone").eq("member_code", memberQuery).limit(1).maybeSingle();
    if (byCode) return { id: byCode.id, name: byCode.name, phone: byCode.phone };

    return null;
  }

  private async resolvePaymentAmount(
    supabase: ReturnType<typeof createSupabaseBackendClient>,
    input: CreatePaymentIntentInput,
    memberId: string | null
  ): Promise<number> {
    if (input.category === "special_event" && input.customAmount) {
      if (input.customAmount <= 0) throw new Error("Payment amount must be greater than 0");
      return input.customAmount;
    }

    if (input.category === "monthly_dues") {
      let contributionAmount = 0;
      
      if (input.tier === "base" || input.tier === "premium") {
        const { data: appSettings } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
        const settings = appSettings?.value as Record<string, unknown> | null;
        const baseAmount = Number(settings?.baseTier ?? 50);
        const premiumAmount = Number(settings?.premiumTier ?? 100);
        contributionAmount = input.tier === "base" ? baseAmount : premiumAmount;
        if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
          throw new Error("Configured contribution period amount is invalid.");
        }
      } else {
        if (!memberId) {
          throw new Error("A valid member is required to resolve custom Educational Subscriptions amount.");
        }
        const { data, error } = await supabase.rpc("resolve_payment_amount", {
          p_member_id: memberId,
          p_category: input.category
        });
        if (!error && data !== null) {
          contributionAmount = Number(data);
        } else {
          throw new Error("Failed to resolve Educational Subscriptions amount.");
        }
      }
      
      return contributionAmount;
    }

    if (input.category === "special_event" && input.eventId) {
      const { data, error } = await supabase.rpc("resolve_payment_amount", {
        p_member_id: memberId || null,
        p_category: input.category,
        p_event_id: input.eventId,
      });
      if (!error && data !== null && Number(data) > 0) {
         return Number(data);
      }
    }

    if (input.customAmount && input.customAmount > 0) {
       return input.customAmount;
    }

    throw new Error("Unable to resolve valid payment amount for this intent.");
  }

  async createPendingPayment(input: CreatePaymentIntentInput, actor: ActorContext): Promise<PaymentDTO> {
    void actor;
    const supabase = createSupabaseBackendClient();
    const memberDetails = await this.resolveMemberDetails(supabase, input.memberQuery);
    const memberId = memberDetails?.id || null;
    
    // Override payer details if member was found
    const finalPayerName = memberDetails?.name || input.payerName;
    const finalPayerPhone = memberDetails?.phone || input.payerPhone;

    // Reuse an active intent when checkout is retried. The partial unique
    // indexes in migration 054 provide the database-level race protection.
    let existingQuery = supabase
      .from("payments")
      .select("*, payment_months(*)")
      .eq("status", "pending")
      .eq("category", input.category)
      .is("voided_at", null)
      .limit(1);
    existingQuery = memberId
      ? existingQuery.eq("member_id", memberId)
      : existingQuery.eq("payer_phone", finalPayerPhone).is("member_id", null);
      if (input.category === "special_event" && input.eventId) {
        existingQuery = existingQuery.eq("event_id", input.eventId);
      }
      const { data: existing } = await existingQuery.maybeSingle();
      
      const amount = await this.resolvePaymentAmount(supabase, input, memberId);
      const amountMinor = Math.round(amount * 100);
      if (
        !Number.isFinite(amount) || amount <= 0 || amount > 99_999_999.99 ||
        !Number.isSafeInteger(amountMinor) || Math.abs(amount * 100 - amountMinor) > 1e-7
      ) {
        throw new Error("Resolved payment amount is invalid.");
      }

      if (existing) {
        const requestedMonths = input.category === "monthly_dues" ? (input.selectedMonthIds ?? []).slice().sort() : [];
        const existingMonths = (existing.payment_months || [])
          .map((month: { month_key: string }) => month.month_key)
          .sort();
        const termsChanged =
          Number(existing.amount) !== amount ||
          existing.tier !== (input.tier ?? null) ||
          existing.method !== input.method ||
          existing.event_id !== (input.eventId ?? null) ||
          existing.collected_by_admin_id !== (input.receivedByAdminId ?? null) ||
          JSON.stringify(existingMonths) !== JSON.stringify(requestedMonths);

        if (termsChanged) {
          if (existing.gateway_order_id || existing.gateway_payment_id) {
            throw {
              code: "INVALID_PAYMENT_STATUS_TRANSITION",
              type: "validation",
              message: "An active provider order exists for this payment. Complete it before changing the payment details.",
              retryable: false,
            };
          }

          const { data: updated, error: updateError } = await supabase.rpc("update_pending_payment_months_atomic", {
            p_payment_id: existing.id,
            p_amount: amount,
            p_tier: input.tier ?? null,
            p_month_keys: requestedMonths,
            p_method: input.method,
            p_event_id: input.eventId ?? null,
            p_collected_by_admin_id: input.receivedByAdminId ?? null,
            p_notes: input.notes ?? null,
          });
          if (updateError) throw updateError;
          if (updated !== true) {
            throw {
              code: "INVALID_PAYMENT_STATUS_TRANSITION",
              type: "validation",
              message: "This pending payment changed while being updated. Please start again.",
              retryable: true,
            };
          }

          const { data: refreshed, error: refreshError } = await supabase
            .from("payments")
            .select("*, payment_months(*)")
            .eq("id", existing.id)
            .single();
          if (refreshError || !refreshed) throw refreshError || new Error("Updated payment was not returned.");
          return mapRowToPaymentDTO(refreshed, refreshed.payment_months || []);
        }
        return mapRowToPaymentDTO(existing, existing.payment_months || []);
      }

    const { data: receiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
    if (receiptIdError || !receiptId) throw new Error("Failed to generate receipt ID");

    const { data: paymentId, error } = await supabase.rpc("create_pending_payment_atomic", {
      p_member_id: memberId,
      p_receipt_id: receiptId,
      p_payer_phone: finalPayerPhone,
      p_payer_name: finalPayerName ?? null,
      p_category: input.category,
      p_method: input.method,
      p_amount: amount,
      p_tier: input.tier ?? null,
      p_event_id: input.eventId ?? null,
      p_collected_by_admin_id: input.receivedByAdminId ?? null,
      p_notes: input.notes ?? null,
      p_month_keys: input.category === "monthly_dues" ? (input.selectedMonthIds ?? []) : [],
    });
    if (error || !paymentId) throw error || new Error("Pending payment was not created.");

    const paymentWithMonths = await supabase.from("payments").select("*, payment_months(*)").eq("id", paymentId).single();
    if (paymentWithMonths.error || !paymentWithMonths.data) {
      throw paymentWithMonths.error || new Error("Pending payment could not be loaded after creation.");
    }

    return mapRowToPaymentDTO(paymentWithMonths.data, paymentWithMonths.data.payment_months || []);
  }

  async recordCashEntry(input: RecordCashEntryInput, actor: ActorContext): Promise<CashEntryDTO> {
    const supabase = createSupabaseBackendClient();

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("name, status")
      .eq("id", input.receivedByAdminId)
      .single();
    if (adminError || !adminUser || adminUser.status !== "active") {
      throw adminError || new Error("The selected cash receiver is not active.");
    }
    const { data: receiverPermission, error: permissionError } = await supabase
      .from("admin_permissions")
      .select("permission_code")
      .eq("admin_id", input.receivedByAdminId)
      .eq("permission_code", "payments.record_cash")
      .maybeSingle();
    if (permissionError || !receiverPermission) {
      throw permissionError || new Error("The selected administrator is not enabled to receive cash.");
    }

    const { data: receiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
    if (receiptIdError || !receiptId) throw new Error("Failed to generate receipt ID");

    let payerPhone = input.guestPhone;
    let payerName = input.guestName;

    if (input.memberId) {
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("phone, name")
        .eq("id", input.memberId)
        .maybeSingle();
      if (memberError || !member) throw memberError || new Error("Selected member was not found.");
      payerPhone = member.phone;
      payerName = member.name;
    }

    if (!payerPhone) {
      throw new Error("A valid payer phone is required for cash entry payment.");
    }

    const { data, error } = await supabase.rpc("record_cash_payment_atomic", {
      p_idempotency_key: input.idempotencyKey,
      p_request_hash: createHash("sha256").update(JSON.stringify({
        memberId: input.memberId ?? null,
        payerName: payerName ?? null,
        payerPhone,
        category: input.category,
        amount: input.amount,
        eventId: input.eventId ?? null,
        months: input.months ?? null,
        receivedByAdminId: input.receivedByAdminId,
        notes: input.notes ?? null,
      })).digest("hex"),
      p_member_id: input.memberId ?? null,
      p_receipt_id: receiptId,
      p_payer_name: payerName ?? null,
      p_payer_phone: payerPhone,
      p_category: input.category,
      p_amount: input.amount,
      p_event_id: input.eventId ?? null,
      p_months: input.months ?? null,
      p_received_by_admin_id: input.receivedByAdminId,
      p_received_by_admin_name: adminUser.name,
      p_recorded_by_admin_id: actor.adminId,
      p_notes: input.notes ?? null,
    });
    if (error || !data) throw error || new Error("Cash entry was not returned after creation.");
    const cashEntry = Array.isArray(data) ? data[0] : data;
    const { data: paymentRecord, error: paymentRecordError } = await supabase
      .from("payments")
      .select("receipt_id")
      .eq("id", cashEntry.payment_id)
      .single();
    if (paymentRecordError || !paymentRecord) {
      throw paymentRecordError || new Error("Cash payment receipt reference was not returned.");
    }

    return { ...mapRowToCashEntryDTO(cashEntry), receiptId: paymentRecord.receipt_id };
  }

  async approve(paymentId: string, actor: ActorContext, notes?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "confirmed",
      notes: notes,
      verified_by_admin_id: actor.adminId,
      verified_at: new Date().toISOString()
    }).eq("id", paymentId).eq("status", "pending").eq("method", "cash_handover").select("*").maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("This payment is no longer a pending cash handover.");
    return mapRowToPaymentDTO(data);
  }

  async reject(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "rejected",
      notes: reason,
      verified_by_admin_id: actor.adminId,
      verified_at: new Date().toISOString()
    }).eq("id", paymentId).eq("status", "pending").eq("method", "cash_handover").select("*").maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("This payment is no longer a pending cash handover.");
    return mapRowToPaymentDTO(data);
  }

  async cancel(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "cancelled",
      notes: reason
    }).eq("id", paymentId).eq("status", "pending").eq("method", "cash_handover").select("*").maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Only pending cash handovers can be cancelled.");
    return mapRowToPaymentDTO(data);
  }

  async updateNotes(paymentId: string, notes: string | null): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("payments")
      .update({ notes })
      .eq("id", paymentId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRowToPaymentDTO(data);
  }

  async voidPayment(paymentId: string, actor: ActorContext, reason: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      voided_at: new Date().toISOString(),
      voided_by_admin_id: actor.adminId,
      void_reason: reason,
    }).eq("id", paymentId).is("voided_at", null).select("*").single();
    if (error) throw error;
    return mapRowToPaymentDTO(data);
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").select("*, payment_months(*)").eq("gateway_order_id", gatewayOrderId).single();
    if (error || !data) return null;
    return mapRowToPaymentDTO(data, data.payment_months || []);
  }

  async setGatewayOrderIdIfUnset(paymentId: string, gatewayOrderId: string, expectedPayment: PaymentDTO): Promise<boolean> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("claim_razorpay_order_if_unchanged", {
      p_payment_id: paymentId,
      p_gateway_order_id: gatewayOrderId,
      p_expected_member_id: expectedPayment.memberId ?? null,
      p_expected_payer_phone: expectedPayment.payerPhone,
      p_expected_payer_name: expectedPayment.payerName ?? null,
      p_expected_category: expectedPayment.category,
      p_expected_method: expectedPayment.method,
      p_expected_amount: expectedPayment.amount,
      p_expected_tier: expectedPayment.tier ?? null,
      p_expected_event_id: expectedPayment.eventId ?? null,
      p_expected_collected_by_admin_id: expectedPayment.collectedByAdminId ?? null,
      p_expected_notes: expectedPayment.notes ?? null,
      p_expected_month_keys: (expectedPayment.months ?? []).map((month) => month.monthKey).sort(),
    });
    if (error) throw error;
    return data === true;
  }

  async confirmGatewayPayment(input: ConfirmGatewayPaymentInput): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data: current, error: currentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", input.paymentId)
      .single();
    if (currentError || !current) throw currentError || new Error("Payment not found");
    if (
      current.gateway_provider !== "razorpay" ||
      current.gateway_order_id !== input.gatewayOrderId
    ) {
      throw new Error("Razorpay order does not belong to this payment.");
    }

    const expectedAmountMinor = Math.round(Number(current.amount) * 100);
    if (
      !Number.isSafeInteger(input.amountMinor) ||
      expectedAmountMinor !== input.amountMinor ||
      input.currency !== "INR"
    ) {
      throw new Error("Razorpay payment amount or currency does not match.");
    }

    if (current.status === "confirmed") {
      if (current.gateway_payment_id === input.gatewayPaymentId) {
        return mapRowToPaymentDTO(current);
      }
      throw new Error("This payment was already confirmed with a different provider payment.");
    }
    if (current.status !== "pending") throw new Error("Only pending payments can be confirmed.");

    const { data, error } = await supabase.from("payments").update({
      status: "confirmed",
      gateway_payment_id: input.gatewayPaymentId,
      gateway_signature: input.gatewaySignature ?? null,
      paid_at: new Date().toISOString()
    })
      .eq("id", input.paymentId)
      .eq("status", "pending")
      .eq("gateway_provider", "razorpay")
      .eq("gateway_order_id", input.gatewayOrderId)
      .eq("amount", current.amount)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (data) return mapRowToPaymentDTO(data);

    // Another verified callback may have won the conditional update. Treat only
    // the same provider payment as an idempotent success.
    const { data: latest, error: latestError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", input.paymentId)
      .single();
    if (latestError || !latest) throw latestError || new Error("Payment not found");
    if (
      latest.status === "confirmed" &&
      latest.gateway_order_id === input.gatewayOrderId &&
      latest.gateway_payment_id === input.gatewayPaymentId
    ) {
      return mapRowToPaymentDTO(latest);
    }
    throw new Error("Payment state changed before confirmation completed.");
  }

  async failPayment(paymentId: string, reason?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "failed",
      notes: reason,
    }).eq("id", paymentId).select("*").single();

    if (error) throw error;
    return mapRowToPaymentDTO(data);
  }
}

