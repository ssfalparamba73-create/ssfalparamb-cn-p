export type MemberStatus = "active" | "inactive" | "blocked" | "left";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface Member {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  age?: number;
  bloodGroup?: BloodGroup;
  isBloodDonor: boolean;
  donorAvailable: boolean;
  address?: string;
  area?: string;
  occupation?: string;
  familyCount?: number;
  status: MemberStatus;
  monthlyTier: "base" | "premium" | "custom" | "flexible";
  monthlyAmount: number;
  pinStatus: "not_issued" | "issued" | "reset_required";
  joinedAt?: string;
  lastPaidAt?: string;
  duesPending: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  memberId: string;
  name: string;
  relationship: string;
  age?: number;
  bloodGroup?: BloodGroup;
  isBloodDonor?: boolean;
  phone?: string;
}

export type PaymentCategory = "monthly_dues" | "special_event";
export type PaymentMethod = "upi" | "qr_code" | "cash_handover" | "admin_cash_entry";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded" | "cancelled";

export interface Payment {
  id: string;
  receiptId: string;
  memberId?: string;
  payerName?: string;
  payerPhone: string;
  category: PaymentCategory;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  months?: string[];
  tier?: "base" | "premium" | "custom" | "flexible";
  eventId?: string;
  eventName?: string;
  collectedByAdminId?: string;
  collectedByAdminName?: string;
  recordedByAdminId?: string;
  verifiedByAdminId?: string;
  referenceId?: string;
  notes?: string;
  paidAt: string;
  recordedAt: string;
  verifiedAt?: string;
}

export interface CashHandover {
  id: string;
  paymentId: string;
  memberId?: string;
  payerPhone: string;
  amount: number;
  category: PaymentCategory;
  months?: string[];
  eventId?: string;
  receivedByAdminId: string;
  receivedByAdminName: string;
  recordedByAdminId?: string;
  status: "received" | "recorded" | "verified" | "disputed";
  receivedAt: string;
  recordedAt?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description?: string;
  suggestedAmount?: number;
  minimumAmount: number;
  isActive: boolean;
  receiptTheme: "amber" | "default";
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface SupportContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  whatsappEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export type AdminRole = "president" | "secretary" | "treasurer" | "collector" | "viewer";

export interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
  phone: string;
  avatarInitials: string;
  canReceiveCash: boolean;
  canVerifyPayments: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  status: "active" | "inactive";
  lastLoginAt?: string;
}

export interface AuditLogEntry {
  id: string;
  actorAdminId: string;
  actorName: string;
  action: string;
  entityType: "member" | "payment" | "cash_handover" | "event" | "support_contact" | "admin_user" | "settings";
  entityId: string;
  summary: string;
  ip?: string;
  device?: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
}
