import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { CreatePaymentIntentInput, PaymentRepository, RecordCashEntryInput } from "../../../contracts/payment.contract";
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
      const { data } = await supabase.from("members").select("id, full_name, phone").eq("id", memberQuery).maybeSingle();
      if (data) return { id: data.id, name: data.full_name, phone: data.phone };
    }

    const { data: byPhone } = await supabase
      .from("members")
      .select("id, full_name, phone")
      .eq("phone", memberQuery)
      .neq("status", "left")
      .limit(1)
      .maybeSingle();
    if (byPhone) return { id: byPhone.id, name: byPhone.full_name, phone: byPhone.phone };

    const { data: byCode } = await supabase.from("members").select("id, full_name, phone").eq("member_code", memberQuery).limit(1).maybeSingle();
    if (byCode) return { id: byCode.id, name: byCode.full_name, phone: byCode.phone };

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
      let monthlyAmount = 0;
      
      if (input.tier === "base" || input.tier === "premium") {
        const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["monthly_due_base_amount", "monthly_due_premium_amount"]);
        const baseAmount = Number(settings?.find(s => s.key === "monthly_due_base_amount")?.value || 50);
        const premiumAmount = Number(settings?.find(s => s.key === "monthly_due_premium_amount")?.value || 100);
        monthlyAmount = input.tier === "base" ? baseAmount : premiumAmount;
      } else {
        if (!memberId) {
          throw new Error("A valid member is required to resolve custom monthly dues amount.");
        }
        const { data, error } = await supabase.rpc("resolve_payment_amount", {
          p_member_id: memberId,
          p_category: input.category
        });
        if (!error && data !== null) {
          monthlyAmount = Number(data);
        } else {
          throw new Error("Failed to resolve monthly dues amount.");
        }
      }
      
      const monthsCount = input.selectedMonthIds && input.selectedMonthIds.length > 0 ? input.selectedMonthIds.length : 1;
      return monthlyAmount * monthsCount;
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

      if (existing) {
        if (existing.amount !== amount || existing.tier !== input.tier) {
          // Update the existing pending payment to reflect the new tier/amount
          const { data: updated, error: updateError } = await supabase.from("payments")
            .update({ amount: amount, tier: input.tier })
            .eq("id", existing.id)
            .select("*, payment_months(*)")
            .single();
          if (updateError) throw updateError;
          return mapRowToPaymentDTO(updated, updated.payment_months || []);
        }
        return mapRowToPaymentDTO(existing, existing.payment_months || []);
      }

    const { data: receiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
    if (receiptIdError || !receiptId) throw new Error("Failed to generate receipt ID");

    const { data, error } = await supabase.from("payments").insert([{
      member_id: memberId,
      receipt_id: receiptId,
      payer_phone: finalPayerPhone,
      payer_name: finalPayerName,
      category: input.category,
      method: input.method,
      amount: amount,
      status: "pending",
      tier: input.tier,
      event_id: input.eventId,
      collected_by_admin_id: input.receivedByAdminId,
      notes: input.notes,
    }]).select("*").single();

    if (error) throw error;
    
    if (input.category === "monthly_dues" && input.selectedMonthIds && input.selectedMonthIds.length > 0) {
      // Calculate amount per month (divide total amount by number of months)
      const amountPerMonth = amount / input.selectedMonthIds.length;
      const monthsData = input.selectedMonthIds.map(monthKey => ({
        payment_id: data.id,
        month_key: monthKey,
        amount: amountPerMonth
      }));
      
      await supabase.from("payment_months").insert(monthsData);
    }
    
    const paymentWithMonths = await supabase.from("payments").select("*, payment_months(*)").eq("id", data.id).single();

    return mapRowToPaymentDTO(paymentWithMonths.data, paymentWithMonths.data?.payment_months || []);
  }

  async recordCashEntry(input: RecordCashEntryInput, actor: ActorContext): Promise<CashEntryDTO> {
    const supabase = createSupabaseBackendClient();

    const { data: adminUser } = await supabase.from("admin_users").select("name").eq("id", input.receivedByAdminId).single();
    if (!adminUser) throw new Error("Invalid admin user for cash entry");

    const { data: receiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
    if (receiptIdError || !receiptId) throw new Error("Failed to generate receipt ID");

    let payerPhone = input.guestPhone;
    let payerName = input.guestName;

    if (input.memberId && (!payerPhone || !payerName)) {
      const { data: member } = await supabase
        .from("members")
        .select("phone, name")
        .eq("id", input.memberId)
        .single();

      if (member) {
        if (!payerPhone) payerPhone = member.phone;
        if (!payerName) payerName = member.name;
      }
    }

    if (!payerPhone) {
      throw new Error("A valid payer phone is required for cash entry payment.");
    }

    const { data: payment, error: paymentError } = await supabase.from("payments").insert([{
      member_id: input.memberId || null,
      receipt_id: receiptId,
      payer_name: payerName,
      payer_phone: payerPhone,
      category: input.category,
      method: "admin_cash_entry",
      amount: input.amount,
      status: "confirmed",
      event_id: input.eventId || null,
      recorded_by_admin_id: actor.adminId,
      collected_by_admin_id: input.receivedByAdminId,
      collected_by_admin_name: adminUser.name,
      paid_at: new Date().toISOString(),
      recorded_at: new Date().toISOString(),
      notes: input.notes,
    }]).select("*").single();

    if (paymentError || !payment) {
      throw new Error("Failed to create linked payment for cash entry");
    }

    const { data, error } = await supabase.from("cash_entries").insert([{
      payment_id: payment.id,
      member_id: input.memberId,
      payer_name: payerName,
      payer_phone: payerPhone,
      category: input.category,
      amount: input.amount,
      months: input.months,
      event_id: input.eventId,
      received_by_admin_id: input.receivedByAdminId,
      received_by_admin_name: adminUser.name,
      notes: input.notes,
      status: "recorded"
    }]).select("*").single();

    if (error) {
      throw new Error(`Cash entry insertion failed. Payment ID was ${payment.id}: ${error.message}`);
    }

    return mapRowToCashEntryDTO(data);
  }

  async approve(paymentId: string, actor: ActorContext, notes?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "confirmed",
      notes: notes,
      verified_by_admin_id: actor.adminId,
      verified_at: new Date().toISOString()
    }).eq("id", paymentId).select("*").single();

    if (error) throw error;
    return mapRowToPaymentDTO(data);
  }

  async reject(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "rejected",
      notes: reason,
      verified_by_admin_id: actor.adminId,
      verified_at: new Date().toISOString()
    }).eq("id", paymentId).select("*").single();

    if (error) throw error;
    return mapRowToPaymentDTO(data);
  }

  async cancel(paymentId: string, actor: ActorContext, reason?: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("payments").update({
      status: "cancelled",
      notes: reason
    }).eq("id", paymentId).select("*").single();

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

  async updateGatewayOrderId(paymentId: string, gatewayOrderId: string, paymentSessionId?: string): Promise<void> {
    const supabase = createSupabaseBackendClient();

    const { error } = await supabase.from("payments").update({
      gateway_order_id: gatewayOrderId,
      gateway_provider: "cashfree"
    }).eq("id", paymentId);

    if (error) throw error;
  }

  async confirmPayment(paymentId: string, gatewayPaymentId: string, gatewaySignature: string): Promise<PaymentDTO> {
    const supabase = createSupabaseBackendClient();
    const { data: current, error: currentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();
    if (currentError || !current) throw currentError || new Error("Payment not found");
    if (current.status === "confirmed") return mapRowToPaymentDTO(current);
    if (current.status !== "pending") throw new Error("Only pending payments can be confirmed.");

    const { data, error } = await supabase.from("payments").update({
      status: "confirmed",
      gateway_payment_id: gatewayPaymentId,
      gateway_signature: gatewaySignature,
      paid_at: new Date().toISOString()
    }).eq("id", paymentId).eq("status", "pending").select("*").single();

    if (error) throw error;
    return mapRowToPaymentDTO(data);
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
