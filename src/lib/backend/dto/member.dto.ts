import type { ID, ISODateTime } from "../contracts/common.contract";

export type MemberStatus = "active" | "inactive" | "blocked" | "left";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type MonthlyTier = "base" | "premium" | "custom" | "flexible";
export type PinStatus = "not_issued" | "issued" | "reset_required";

export interface FamilyMemberDTO {
  id: ID;
  memberId: ID;
  name: string;
  relationship: string;
  age?: number;
  bloodGroup?: BloodGroup;
  isBloodDonor?: boolean;
  phone?: string;
}

export interface MemberDTO {
  id: ID;
  memberCode: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  age?: number;
  bloodGroup?: BloodGroup;
  isBloodDonor: boolean;
  donorAvailable: boolean;
  address?: string;
  area?: string;
  unit?: string;
  sector?: string;
  occupation?: string;
  familyCount?: number;
  status: MemberStatus;
  monthlyTier: MonthlyTier;
  monthlyAmount: number;
  pinStatus: PinStatus;
  joinedAt?: ISODateTime;
  lastPaidAt?: ISODateTime;
  duesPending: number;
  lastRemindedAt?: ISODateTime;
  reminderCount: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  familyMembers?: FamilyMemberDTO[];
}

export interface IssuedMemberPinDTO {
  memberId: ID;
  memberName: string;
  phone: string;
  pin: string;
  message: string;
  issuedAt: ISODateTime;
}

export interface MemberProfileDTO {
  id: ID;
  memberId: ID;
  memberCode: string;
  name: string;
  initials: string;
  phone: string;
  whatsapp?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
  unit?: string;
  sector?: string;
  joinedYear?: string;
  occupation?: string;
  biometricEnabled: boolean;
  profileComplete: boolean;
  familyMembers: FamilyMemberDTO[];
}

export interface MemberDashboardDTO {
  member: {
    id: ID;
    memberCode: string;
    name: string;
    initials: string;
    status: MemberStatus;
  };
  dueSummary: {
    pendingAmount: number;
    monthlyAmount: number;
    pendingMonths: string[];
    hasOverdue: boolean;
  };
  recentActivity: Array<{
    id: ID;
    type: "payment" | "reminder" | "notification";
    title: string;
    description?: string;
    createdAt: ISODateTime;
  }>;
}

export interface MemberDirectoryItemDTO {
  id: ID;
  memberCode: string;
  name: string;
  initials: string;
  area?: string;
  bloodGroup?: BloodGroup;
  isBloodDonor: boolean;
  donorAvailable: boolean;
  phone?: string;
  paymentProgressPercent?: number;
}

export interface MemberListFilters {
  search?: string;
  area?: string;
  status?: MemberStatus;
  monthlyTier?: MonthlyTier;
  paymentStatus?: "clear" | "arrears" | "long_overdue";
  bloodGroup?: BloodGroup;
  isBloodDonor?: boolean;
  donorAvailable?: boolean;
  sort?: "newest" | "name-asc" | "name-desc" | "dues-desc";
}
