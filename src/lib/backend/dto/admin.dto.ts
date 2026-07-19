import type { ID, ISODateTime } from "../contracts/common.contract";

export type AdminRole =
  | "super_admin"
  | "president"
  | "secretary"
  | "treasurer"
  | "collector"
  | "viewer";

export interface AdminPermissionDTO {
  code: string;
  description?: string;
}

export interface AdminUserDTO {
  id: ID;
  memberId?: ID;
  name: string;
  phone: string;
  avatarInitials: string;
  roles: AdminRole[];
  permissions: string[];
  canReceiveCash: boolean;
  canVerifyPayments: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  status: "active" | "inactive";
  lastLoginAt?: ISODateTime;
}

export interface AdminMemberCandidateDTO {
  id: ID;
  memberCode: string;
  name: string;
  phone: string;
}

export interface IssuedAdminCodeDTO {
  admin: AdminUserDTO;
  code: string;
  issuedAt: ISODateTime;
}

export interface AdminSessionDTO {
  admin: AdminUserDTO;
  expiresAt?: ISODateTime;
}

export interface AdminDashboardStatsDTO {
  totalCollected: number;
  monthlyDues: number;
  specialEvents: number;
  pendingAmount: number;
  activeMembers: number;
  paidMembers: number;
  defaulters: number;
  pendingCashHandovers: number;
  availableDonors: number;
  collectionTrend: Array<{
    label: string;
    amount: number;
  }>;
  paymentMethodSplit: Array<{
    method: string;
    percentage: number;
    color?: string;
  }>;
}

export interface AuditLogDTO {
  id: ID;
  actorAdminId?: ID;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  target?: string;
  summary: string;
  severity: "info" | "warning" | "error" | "critical";
  ip?: string;
  device?: string;
  before?: unknown;
  after?: unknown;
  createdAt: ISODateTime;
}
