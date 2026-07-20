import { createHash } from "node:crypto";
import type { ActorContext, PaginatedResult, PaginationInput } from "../../../contracts/common.contract";
import type { CompleteMemberProfileInput, CreateMemberInput, MemberRepository, UpdateMemberInput, UpdateMemberProfileInput } from "../../../contracts/member.contract";
import type { MemberDTO, MemberDirectoryItemDTO, MemberListFilters, MemberProfileDTO, MemberDashboardDTO } from "../../../dto/member.dto";
import { createSupabaseBackendClient } from "../client";
import { mapRowToMemberDirectoryItemDTO, mapRowToMemberDTO, mapRowToMemberProfileDTO } from "../mappers/member.mapper";
import { conflictError, permissionError, rateLimitError, validationError } from "../../../errors/createBackendError";
import { ERROR_CODES } from "../../../errors/errorCodes";

function actorRpcParams(actor: ActorContext) {
  if (!actor.adminId) throw new Error("Admin actor ID is required.");
  return {
    p_actor_admin_id: actor.adminId,
    p_actor_name: actor.actorName ?? null,
    p_ip: actor.ip ?? null,
    p_device: actor.device ?? null,
  };
}

function memberPinEncryptionKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Missing server PIN encryption material.");
  return createHash("sha256")
    .update(`ssf-member-invitation-pin:v1:${serviceRoleKey}`)
    .digest("hex");
}

function throwMutationError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    const isMemberCode = error.message?.includes("member_code");
    throw conflictError(
      isMemberCode ? "Member code already exists." : "Phone number already exists.",
      isMemberCode ? ERROR_CODES.DUPLICATE_MEMBER_CODE : ERROR_CODES.DUPLICATE_PHONE
    );
  }
  throw error;
}

export class SupabaseMemberRepository implements MemberRepository {
  async findById(id: string): Promise<MemberDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: family, error: familyError } = await supabase
      .from("family_members")
      .select("*")
      .eq("member_id", id)
      .order("created_at", { ascending: true });
    if (familyError) throw familyError;
    return mapRowToMemberDTO(data, family || []);
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
    else query = query.neq("status", "left");
    if (filters.bloodGroup) query = query.eq("blood_group", filters.bloodGroup);
    if (filters.area) query = query.eq("area", filters.area);
    if (filters.monthlyTier) query = query.eq("monthly_tier", filters.monthlyTier);
    if (filters.isBloodDonor !== undefined) query = query.eq("is_blood_donor", filters.isBloodDonor);
    if (filters.donorAvailable !== undefined) query = query.eq("donor_available", filters.donorAvailable);
    if (filters.paymentStatus === "clear") query = query.lte("dues_pending", 0);
    if (filters.paymentStatus === "arrears") query = query.gt("dues_pending", 0);
    if (filters.paymentStatus === "long_overdue") query = query.gt("dues_pending", 0);
    if (filters.search) {
      const search = filters.search.replace(/[,()%]/g, "").trim();
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,member_code.ilike.%${search}%`);
      }
    }

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;

    return {
      items: (data || []).map((row) => mapRowToMemberDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async listDirectory(filters: MemberListFilters, pagination: PaginationInput): Promise<PaginatedResult<MemberDirectoryItemDTO>> {
    const supabase = createSupabaseBackendClient();
    let query = supabase
      .from("members")
      .select("id, member_code, name, phone, area, blood_group, is_blood_donor, donor_available", { count: "exact" })
      .eq("status", "active");

    if (filters.bloodGroup) query = query.eq("blood_group", filters.bloodGroup);
    if (filters.area) query = query.eq("area", filters.area);
    if (filters.donorAvailable !== undefined) query = query.eq("donor_available", filters.donorAvailable);
    if (filters.search) {
      const search = filters.search.replace(/[,()%]/g, "").trim();
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,member_code.ilike.%${search}%`);
      }
    }

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const { data, count, error } = await query
      .order("name", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;

    return {
      items: (data || []).map((row) => mapRowToMemberDirectoryItemDTO(row)),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  }

  async create(input: CreateMemberInput, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    const { familyMembers, ...memberInput } = input;
    const { data, error } = await supabase.rpc("admin_create_member", {
      p_input: memberInput,
      p_family: familyMembers ?? [],
      ...actorRpcParams(actor),
    });
    if (error) throwMutationError(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) throw new Error("Member was not returned after creation.");
    const member = await this.findById(row.id);
    if (!member) throw new Error("Member was not found after creation.");
    return member;
  }

  async update(id: string, input: UpdateMemberInput, actor: ActorContext): Promise<MemberDTO> {
    const supabase = createSupabaseBackendClient();
    const { familyMembers, ...memberInput } = input;
    const { error } = await supabase.rpc("admin_update_member", {
      p_member_id: id,
      p_input: memberInput,
      p_family: familyMembers ?? null,
      ...actorRpcParams(actor),
    });
    if (error) throwMutationError(error);
    const member = await this.findById(id);
    if (!member) throw new Error("Member was not found after update.");
    return member;
  }

  async updateProfile(memberId: string, input: UpdateMemberProfileInput, actor: ActorContext): Promise<MemberProfileDTO> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("member_update_profile", {
      p_member_id: memberId,
      p_input: input,
      p_actor_name: actor.actorName ?? null,
      p_ip: actor.ip ?? null,
      p_device: actor.device ?? null,
    });
    if (error) throw error;
    const profile = await this.getProfile(memberId);
    if (!profile) throw new Error("Profile was not found after update.");
    return profile;
  }

  async completeProfile(memberId: string, input: CompleteMemberProfileInput, actor: ActorContext): Promise<MemberProfileDTO> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("member_complete_profile", {
      p_member_id: memberId,
      p_input: input,
      p_actor_name: actor.actorName ?? null,
      p_ip: actor.ip ?? null,
      p_device: actor.device ?? null,
    });
    if (error) throw error;
    const profile = await this.getProfile(memberId);
    if (!profile) throw new Error("Profile was not found after completion.");
    return profile;
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("admin_soft_delete_member", {
      p_member_id: id,
      ...actorRpcParams(actor),
    });
    if (error) throw error;
  }

  async issuePin(memberId: string, pin: string, actor: ActorContext): Promise<string> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_issue_member_pin", {
      p_member_id: memberId,
      p_pin: pin,
      p_pin_encryption_key: memberPinEncryptionKey(),
      ...actorRpcParams(actor),
    });
    if (error) {
      if (error.code === "P0001" && error.message?.includes("MEMBER_INVITATION_RATE_LIMITED")) {
        throw rateLimitError("Please wait before generating another member invitation.");
      }
      if (error.code === "42501") {
        throw permissionError("Member update permission required.");
      }
      if (error.code === "22023") {
        throw validationError("A login invitation can only be issued to an active member.", "id");
      }
      throw error;
    }
    if (typeof data !== "string") throw new Error("PIN issue timestamp was not returned.");
    return data;
  }

  async getCurrentPin(memberId: string, actor: ActorContext): Promise<{ pin: string; issuedAt: string } | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("admin_get_member_pin_secret", {
      p_member_id: memberId,
      p_pin_encryption_key: memberPinEncryptionKey(),
      p_actor_admin_id: actor.adminId,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.pin || !row.issued_at) return null;
    return {
      pin: row.pin,
      issuedAt: row.issued_at,
    };
  }

  async getProfile(memberId: string): Promise<MemberProfileDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("members").select("*").eq("id", memberId).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { data: familyData, error: familyError } = await supabase
      .from("family_members")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: true });
    if (familyError) throw familyError;
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
    void actor;
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.rpc("increment_reminder_count", { p_member_id: memberId });
    if (error) throw error;

    const { data: member } = await supabase.from("members").select("*").eq("id", memberId).single();
    if (!member) throw new Error("Member not found after increment");
    return mapRowToMemberDTO(member);
  }
}
