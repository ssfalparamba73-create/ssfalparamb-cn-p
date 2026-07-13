import type { ActorContext } from "../../../contracts/common.contract";
import type { ReceiptRepository } from "../../../contracts/payment.contract";
import type { ReceiptDTO } from "../../../dto/payment.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToReceiptDTO } from "../mappers/payment.mapper";

export interface CreatedReceiptWithToken {
  receipt: ReceiptDTO;
  rawToken: string;
}

export class SupabaseReceiptRepository implements ReceiptRepository {
  async createForPaymentWithToken(paymentId: string, actor: ActorContext): Promise<CreatedReceiptWithToken> {
    const supabase = createSupabaseBackendClient();
    
    const { data: payment, error: payError } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (payError || !payment) throw new Error("Payment not found");
    
    let receiptId = payment.receipt_id;

    if (!receiptId) {
      const { data: generatedReceiptId, error: receiptIdError } = await supabase.rpc("generate_receipt_id");
      if (receiptIdError || !generatedReceiptId) {
        throw new Error("Failed to generate receipt ID");
      }
      receiptId = generatedReceiptId;

      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({ receipt_id: receiptId })
        .eq("id", paymentId);

      if (updatePaymentError) {
        throw updatePaymentError;
      }
    }

    const rawToken = crypto.randomUUID();
    const { data: tokenHash, error: tokenHashError } = await supabase.rpc("hash_receipt_token", {
      p_token: rawToken,
    });
    if (tokenHashError || !tokenHash) throw new Error("Failed to secure receipt token");
    
    // Default expiry 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase.from("payment_receipts").insert([{
      payment_id: paymentId,
      receipt_id: receiptId,
      public_token_hash: tokenHash,
      token_expires_at: expiresAt.toISOString(),
      amount: payment.amount,
      issued_at: new Date().toISOString(),
    }]).select("*").single();
    
    if (error) throw error;
    
    return {
      receipt: mapRowToReceiptDTO(data, payment),
      rawToken
    };
  }

  async createForPayment(paymentId: string, actor: ActorContext): Promise<ReceiptDTO> {
    const created = await this.createForPaymentWithToken(paymentId, actor);
    return created.receipt;
  }

  async findByReceiptIdAndToken(receiptId: string, token: string): Promise<ReceiptDTO | null> {
    const supabase = createSupabaseBackendClient();
    
    const { data: tokenHash, error: tokenHashError } = await supabase.rpc("hash_receipt_token", {
      p_token: token,
    });
    if (tokenHashError || !tokenHash) return null;

    const { data, error } = await supabase.from("payment_receipts")
      .select("*, payments(*)")
      .eq("receipt_id", receiptId)
      .eq("public_token_hash", tokenHash)
      .gt("token_expires_at", new Date().toISOString())
      .single();
      
    if (error || !data) return null;
    return mapRowToReceiptDTO(data, data.payments || {});
  }

  async findForMember(paymentId: string, memberId: string): Promise<ReceiptDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).eq("member_id", memberId).single();
    if (!payment) return null;
    
    const { data, error } = await supabase.from("payment_receipts").select("*").eq("payment_id", paymentId).single();
    if (error || !data) return null;
    return mapRowToReceiptDTO(data, payment);
  }

  async incrementViewCount(receiptId: string): Promise<void> {
    const supabase = createSupabaseBackendClient();
    await supabase.rpc("increment_receipt_view_count", { p_receipt_id: receiptId });
  }
}
