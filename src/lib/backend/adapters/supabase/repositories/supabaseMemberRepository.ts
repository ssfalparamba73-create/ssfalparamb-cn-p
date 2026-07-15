import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { CreateMemberInput, MemberRepository, ResetMemberPinInput, UpdateMemberInput, UpdateMemberProfileInput } from "../../../contracts/member.contract";
import type { MemberDTO, MemberDirectoryItemDTO, MemberListFilters, MemberProfileDTO, MemberDashboardDTO } from "../../../dto/member.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToMemberDirectoryItemDTO, mapRowToMemberDTO, mapRowToMemberProfileDTO } from "../mappers/member.mapper";

import { hashPinForPostgres } from "../../../security/pinHash";

export class SupabaseMemberRepository implements MemberRepository {
  async findById(id: string): Promise<MemberDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapRowToMemberDTO(data);
  }

  async findByPhone(phone: string): Promise<MemberDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("phone", phone).single();
    if (error || !data) return null;
    return mapRowToMemberDTO(data);
  }

  async findByMemberCode(memberCode: string): Promise<MemberDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("member_code", memberCode).single();
    if (error || !data) return null;
    return mapRowToMemberDTO(data);
  }

  async list(filters: MemberListFilters, pagination: PaginationInput): Promise<PaginatedResult<MemberDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase.from("members").select("*", { count: "exact" });
    
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.bloodGroup) query = query.eq("blood_group", filters.bloodGroup);
    
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    
    return {
      items: (data || []).map((row: any) => mapRowToMemberDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async listDirectory(filters: MemberListFilters, pagination: PaginationInput): Promise<PaginatedResult<MemberDirectoryItemDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase.from("members").select("*", { count: "exact" });
    
    if (filters.status) query = query.eq("status", filters.status);
    
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    
    return {
      items: (data || []).map((row: any) => mapRowToMemberDirectoryItemDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async create(input: CreateMemberInput, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    
    const insertData: any = {
      name: input.name,
      phone: input.phone,
      alternate_phone: input.alternatePhone,
      age: input.age,
      address: input.address,
      area: input.area,
      occupation: input.occupation,
      monthly_tier: input.monthlyTier,
      monthly_amount: input.monthlyAmount,
    };
    
    if (input.pin) {
      insertData.pin_hash = await hashPinForPostgres(input.pin);
      insertData.pin_status = 'issued';
    }

    const { data, error } = await supabase.from("members").insert([insertData]).select("*").single();
    
    if (error) throw error;
    return mapRowToMemberDTO(data);
  }

  async update(id: string, input: UpdateMemberInput, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.phone) updateData.phone = input.phone;
    if (input.status) updateData.status = input.status;
    if (input.pin) {
      updateData.pin_hash = await hashPinForPostgres(input.pin);
      updateData.pin_status = "issued";
      updateData.pin_updated_at = new Date().toISOString();
      updateData.force_pin_reset = false;
    }
    
    const { data, error } = await supabase.from("members").update(updateData).eq("id", id).select("*").single();
    if (error) throw error;
    return mapRowToMemberDTO(data);
  }

  async resetPin(id: string, input: ResetMemberPinInput, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    const pinHash = await hashPinForPostgres(input.pin);
    const { data, error } = await supabase
      .from("members")
      .update({
        pin_hash: pinHash,
        pin_status: "issued",
        pin_updated_at: new Date().toISOString(),
        force_pin_reset: input.forceReset === true,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw error || new Error("Member not found");
    return mapRowToMemberDTO(data);
  }

  async updateProfile(memberId: string, input: UpdateMemberProfileInput, actor: ActorContext): Promise<MemberProfileDTO> {
    const supabase = createSupabaseBackendClient();
    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.whatsapp) updateData.whatsapp = input.whatsapp;
    if (input.age !== undefined) updateData.age = input.age;
    if (input.bloodGroup) updateData.blood_group = input.bloodGroup;
    if (input.address) updateData.address = input.address;
    if (input.occupation) updateData.occupation = input.occupation;
    if (input.biometricEnabled !== undefined) updateData.biometric_enabled = input.biometricEnabled;

    const { data, error } = await supabase.from("members").update(updateData).eq("id", memberId).select("*").single();
    if (error) throw error;
    return mapRowToMemberProfileDTO(data);
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const supabase = createSupabaseBackendClient();
    await supabase.from("members").update({ status: "left" }).eq("id", id);
  }

  async getProfile(memberId: string): Promise<MemberProfileDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("id", memberId).single();
    if (error || !data) return null;
    
    const { data: familyData } = await supabase.from("family_members").select("*").eq("member_id", memberId);
    return mapRowToMemberProfileDTO(data, familyData || []);
  }

  async getDashboard(memberId: string): Promise<MemberDashboardDTO> {
    const profile = await this.findById(memberId);
    if (!profile) throw new Error("Member not found");
    
    return {
      member: {
        id: profile.id,
        memberCode: profile.memberCode,
        name: profile.name,
        initials: profile.name.substring(0, 2).toUpperCase(),
        status: profile.status,
      },
      dueSummary: {
        pendingAmount: profile.duesPending,
        monthlyAmount: profile.monthlyAmount,
        pendingMonths: [],
        hasOverdue: profile.duesPending > 0,
      },
      recentActivity: [],
    };
  }

  async incrementReminderCount(memberId: string, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("increment_reminder_count", { p_member_id: memberId });
    if (error) throw error;
    
    const { data: member } = await supabase.from("members").select("*").eq("id", memberId).single();
    if (!member) throw new Error("Member not found after increment");
    return mapRowToMemberDTO(member);
  }
}
