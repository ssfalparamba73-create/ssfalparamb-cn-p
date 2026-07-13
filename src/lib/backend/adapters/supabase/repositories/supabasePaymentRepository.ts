import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { CreatePaymentIntentInput, PaymentRepository, PaymentStatusTransitionInput, RecordCashEntryInput } from "../../../contracts/payment.contract";
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
      items: (data || []).map((row: any) => mapRowToPaymentDTO(row, row.payment_months || [])),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async listByMember(memberId: string, pagination: PaginationInput): Promise<PaginatedResult<MemberPaymentHistoryItemDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase.from("payments").select("*", { count: "exact" }).eq("member_id", memberId);
    
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    
    return {
      items: (data || []).map((row: any) => mapRowToMemberPaymentHistoryItemDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  private async resolveMemberId(
    supabase: ReturnType<typeof createSupabaseBackendClient>,
    memberQuery?: string
  ): Promise<string | null> {
    if (!memberQuery) return null;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(memberQuery)) {
      const { data } = await supabase.from("members").select("id").eq("id", memberQuery).single();
      if (data) return data.id;
    }
    
    const { data: byPhone } = await supabase.from("members").select("id").eq("phone", memberQuery).single();
    if (byPhone) return byPhone.id;
    
    const { data: byCode } = await supabase.from("members").select("id").eq("member_code", memberQuery).single();
    if (byCode) return byCode.id;
    
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
      if (!memberId) {
        throw new Error("A valid member is required to resolve monthly dues amount.");
      }

      const { data, error } = await supabase.rpc("resolve_payment_amount", {
        p_member_id: memberId,
        p_category: input.category,
        p_event_id: input.eventId ?? null,
      });

      if (error || data === null || Number(data) <= 0) {
        throw new Error("Failed to resolve monthly dues payment amount.");
      }

      return Number(data);
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
    const memberId = await this.resolveMemberId(supabase, input.memberQuery);
    const amount = await this.resolvePaymentAmount(supabase, input, memberId);

    const { data: receiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
    if (receiptIdError || !receiptId) throw new Error("Failed to generate receipt ID");

    const { data, error } = await supabase.from("payments").insert([{
      member_id: memberId,
      receipt_id: receiptId,
      payer_phone: input.payerPhone,
      payer_name: input.payerName,
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
    return mapRowToPaymentDTO(data);
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
}
