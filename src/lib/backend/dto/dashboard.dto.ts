import type { ID, ISODateTime } from "../contracts/common.contract";
import type { AdminDashboardStatsDTO } from "./admin.dto";
import type { MemberStatus } from "./member.dto";
import type { PaymentCategory, PaymentMethod, PaymentStatus } from "./payment.dto";

export interface DashboardRecentPaymentDTO {
  id: ID;
  receiptId: string;
  payerName: string;
  category: PaymentCategory;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt: ISODateTime;
}

export interface DashboardRecentCashHandoverDTO {
  id: ID;
  amount: number;
  adminName: string;
  date: ISODateTime;
  status: "pending" | "verified";
}

export interface AdminDashboardDTO {
  stats: AdminDashboardStatsDTO;
  recentPayments: DashboardRecentPaymentDTO[];
  recentCashHandovers: DashboardRecentCashHandoverDTO[];
}

export interface MemberDashboardActivityDTO {
  id: ID;
  receiptId: string;
  date: ISODateTime;
  amount: number;
  method: PaymentMethod;
  status: "completed" | "pending" | "failed" | "cancelled";
}

export interface MemberDashboardViewDTO {
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
  recentActivity: MemberDashboardActivityDTO[];
}
