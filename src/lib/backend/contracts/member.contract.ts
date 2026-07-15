import type {
  ActorContext,
  BackendResult,
  PaginatedResult,
  PaginationInput,
} from "./common.contract";
import type {
  MemberDTO,
  MemberProfileDTO,
  MemberDashboardDTO,
  MemberDirectoryItemDTO,
  MemberListFilters,
} from "../dto/member.dto";

export interface CreateMemberInput {
  name: string;
  phone: string;
  alternatePhone?: string;
  age?: number;
  address?: string;
  area?: string;
  occupation?: string;
  monthlyTier: MemberDTO["monthlyTier"];
  monthlyAmount: number;
  pin?: string;
}

export interface ResetMemberPinInput {
  pin: string;
  forceReset?: boolean;
}

export interface UpdateMemberInput extends Partial<CreateMemberInput> {
  status?: MemberDTO["status"];
  bloodGroup?: MemberDTO["bloodGroup"];
  isBloodDonor?: boolean;
  donorAvailable?: boolean;
}

export interface UpdateMemberProfileInput {
  name?: string;
  whatsapp?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
  occupation?: string;
  biometricEnabled?: boolean;
}

export interface MemberRepository {
  findById(id: string): Promise<MemberDTO | null>;
  findByPhone(phone: string): Promise<MemberDTO | null>;
  findByMemberCode(memberCode: string): Promise<MemberDTO | null>;
  list(filters: MemberListFilters, pagination: PaginationInput): Promise<PaginatedResult<MemberDTO>>;
  listDirectory(filters: MemberListFilters, pagination: PaginationInput): Promise<PaginatedResult<MemberDirectoryItemDTO>>;
  create(input: CreateMemberInput, actor: ActorContext): Promise<MemberDTO>;
  update(id: string, input: UpdateMemberInput, actor: ActorContext): Promise<MemberDTO>;
  resetPin(id: string, input: ResetMemberPinInput, actor: ActorContext): Promise<MemberDTO>;
  updateProfile(memberId: string, input: UpdateMemberProfileInput, actor: ActorContext): Promise<MemberProfileDTO>;
  softDelete(id: string, actor: ActorContext): Promise<void>;
  getProfile(memberId: string): Promise<MemberProfileDTO | null>;
  getDashboard(memberId: string): Promise<MemberDashboardDTO>;
  incrementReminderCount(memberId: string, actor: ActorContext): Promise<MemberDTO>;
}

export interface MemberService {
  getCurrentMemberProfile(actor: ActorContext): Promise<BackendResult<MemberProfileDTO>>;
  getDashboard(actor: ActorContext): Promise<BackendResult<MemberDashboardDTO>>;
  updateProfile(input: UpdateMemberProfileInput, actor: ActorContext): Promise<BackendResult<MemberProfileDTO>>;
  listDirectory(
    filters: MemberListFilters,
    pagination: PaginationInput,
    actor: ActorContext
  ): Promise<BackendResult<PaginatedResult<MemberDirectoryItemDTO>>>;
}
