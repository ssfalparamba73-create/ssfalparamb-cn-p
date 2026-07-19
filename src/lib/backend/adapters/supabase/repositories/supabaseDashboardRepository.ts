import type { DashboardRepository } from "../../../contracts/dashboard.contract";
import type {
  AdminDashboardDTO,
  DashboardRecentCashHandoverDTO,
  DashboardRecentPaymentDTO,
  MemberDashboardActivityDTO,
  MemberDashboardViewDTO,
} from "../../../dto/dashboard.dto";
import type { PaymentMethod, PaymentStatus } from "../../../dto/payment.dto";
import { createSupabaseBackendClient } from "../client";

interface PaymentRow {
  id: string;
  receipt_id: string;
  payer_name: string | null;
  category: "monthly_dues" | "special_event";
  method: PaymentMethod;
  amount: number | string;
  status: PaymentStatus;
  paid_at: string | null;
  recorded_at: string;
}

interface CashRow {
  id: string;
  amount: number | string;
  received_by_admin_name: string;
  status: "received" | "recorded" | "verified" | "disputed";
  received_at: string;
}

interface MemberRow {
  id: string;
  member_code: string;
  name: string;
  status: "active" | "inactive" | "blocked" | "left";
  monthly_amount: number | string;
  dues_pending: number | string;
}

interface PaymentMonthRow {
  label: string | null;
  month_key: string;
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function paymentDate(row: PaymentRow): string {
  return row.paid_at ?? row.recorded_at;
}

function mapRecentPayment(row: PaymentRow): DashboardRecentPaymentDTO {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    payerName: row.payer_name ?? "Member",
    category: row.category,
    method: row.method,
    amount: toNumber(row.amount),
    status: row.status,
    paidAt: paymentDate(row),
  };
}

function mapMemberActivity(row: PaymentRow): MemberDashboardActivityDTO {
  const status: MemberDashboardActivityDTO["status"] =
    row.status === "confirmed"
      ? "completed"
      : row.status === "pending"
        ? "pending"
        : row.status === "cancelled" || row.status === "refunded"
          ? "cancelled"
          : "failed";

  return {
    id: row.id,
    receiptId: row.receipt_id,
    date: paymentDate(row),
    amount: toNumber(row.amount),
    method: row.method,
    status,
  };
}

function paymentChannel(method: PaymentMethod): "UPI" | "Cash" | "Admin" {
  if (method === "admin_cash_entry") return "Admin";
  if (method === "cash_handover") return "Cash";
  return "UPI";
}

export class SupabaseDashboardRepository implements DashboardRepository {
  async getAdminDashboard(): Promise<AdminDashboardDTO> {
    const supabase = createSupabaseBackendClient();
    const currentMonthStart = monthStart(new Date());
    const nextMonthStart = addUtcMonths(currentMonthStart, 1);
    const trendStart = addUtcMonths(currentMonthStart, -5);

    const [
      currentPaymentsResult,
      trendPaymentsResult,
      membersResult,
      cashCountResult,
      recentPaymentsResult,
      recentCashResult,
    ] = await Promise.all([
      supabase
        .from("payments")
        .select("id,receipt_id,payer_name,category,method,amount,status,paid_at,recorded_at")
        .eq("status", "confirmed")
        .gte("recorded_at", currentMonthStart.toISOString())
        .lt("recorded_at", nextMonthStart.toISOString()),
      supabase
        .from("payments")
        .select("id,receipt_id,payer_name,category,method,amount,status,paid_at,recorded_at")
        .eq("status", "confirmed")
        .gte("recorded_at", trendStart.toISOString())
        .lt("recorded_at", nextMonthStart.toISOString()),
      supabase
        .from("members")
        .select("id,dues_pending,is_blood_donor,donor_available")
        .eq("status", "active"),
      supabase
        .from("cash_entries")
        .select("id", { count: "exact", head: true })
        .in("status", ["received", "recorded"]),
      supabase
        .from("payments")
        .select("id,receipt_id,payer_name,category,method,amount,status,paid_at,recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabase
        .from("cash_entries")
        .select("id,amount,received_by_admin_name,status,received_at")
        .order("received_at", { ascending: false })
        .limit(5),
    ]);

    const firstError = [
      currentPaymentsResult.error,
      trendPaymentsResult.error,
      membersResult.error,
      cashCountResult.error,
      recentPaymentsResult.error,
      recentCashResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const currentPayments = (currentPaymentsResult.data ?? []) as PaymentRow[];
    const trendPayments = (trendPaymentsResult.data ?? []) as PaymentRow[];
    const members = (membersResult.data ?? []) as Array<{
      id: string;
      dues_pending: number | string;
      is_blood_donor: boolean;
      donor_available: boolean;
    }>;

    const totalCollected = currentPayments.reduce((sum, row) => sum + toNumber(row.amount), 0);
    const monthlyDues = currentPayments
      .filter((row) => row.category === "monthly_dues")
      .reduce((sum, row) => sum + toNumber(row.amount), 0);
    const specialEvents = currentPayments
      .filter((row) => row.category === "special_event")
      .reduce((sum, row) => sum + toNumber(row.amount), 0);
    const pendingAmount = members.reduce((sum, row) => sum + toNumber(row.dues_pending), 0);
    const paidMembers = members.filter((row) => toNumber(row.dues_pending) <= 0).length;
    const defaulters = members.filter((row) => toNumber(row.dues_pending) > 0).length;
    const availableDonors = members.filter(
      (row) => row.is_blood_donor && row.donor_available
    ).length;

    const collectionTrend = Array.from({ length: 6 }, (_, index) => {
      const start = addUtcMonths(trendStart, index);
      const end = addUtcMonths(start, 1);
      const amount = trendPayments
        .filter((row) => {
          const date = Date.parse(row.recorded_at);
          return date >= start.getTime() && date < end.getTime();
        })
        .reduce((sum, row) => sum + toNumber(row.amount), 0);

      return {
        label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(start),
        amount,
      };
    });

    const channelAmounts = new Map<string, number>([
      ["UPI", 0],
      ["Cash", 0],
      ["Admin", 0],
    ]);
    currentPayments.forEach((row) => {
      const channel = paymentChannel(row.method);
      channelAmounts.set(channel, (channelAmounts.get(channel) ?? 0) + toNumber(row.amount));
    });

    const colors: Record<string, string> = {
      UPI: "bg-blue-500",
      Cash: "bg-emerald-500",
      Admin: "bg-amber-500",
    };
    const paymentMethodSplit = Array.from(channelAmounts.entries()).map(([method, amount]) => ({
      method,
      percentage: totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0,
      color: colors[method],
    }));

    return {
      stats: {
        totalCollected,
        monthlyDues,
        specialEvents,
        pendingAmount,
        activeMembers: members.length,
        paidMembers,
        defaulters,
        pendingCashHandovers: cashCountResult.count ?? 0,
        availableDonors,
        collectionTrend,
        paymentMethodSplit,
      },
      recentPayments: ((recentPaymentsResult.data ?? []) as PaymentRow[]).map(mapRecentPayment),
      recentCashHandovers: ((recentCashResult.data ?? []) as CashRow[]).map(
        (row): DashboardRecentCashHandoverDTO => ({
          id: row.id,
          amount: toNumber(row.amount),
          adminName: row.received_by_admin_name,
          date: row.received_at,
          status: row.status === "verified" ? "verified" : "pending",
        })
      ),
    };
  }

  async getMemberDashboard(memberId: string): Promise<MemberDashboardViewDTO | null> {
    const supabase = createSupabaseBackendClient();
    const [memberResult, recentResult, pendingMonthsResult] = await Promise.all([
      supabase
        .from("members")
        .select("id,member_code,name,status,monthly_amount,dues_pending")
        .eq("id", memberId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("id,receipt_id,payer_name,category,method,amount,status,paid_at,recorded_at")
        .eq("member_id", memberId)
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("payment_months(label,month_key)")
        .eq("member_id", memberId)
        .eq("status", "pending"),
    ]);

    const firstError = [memberResult.error, recentResult.error, pendingMonthsResult.error].find(Boolean);
    if (firstError) throw firstError;
    if (!memberResult.data) return null;

    const member = memberResult.data as MemberRow;
    const pendingMonths = ((pendingMonthsResult.data ?? []) as Array<{
      payment_months?: PaymentMonthRow[];
    }>).flatMap((payment) =>
      (payment.payment_months ?? []).map((month) => month.label ?? month.month_key)
    );

    return {
      member: {
        id: member.id,
        memberCode: member.member_code,
        name: member.name,
        initials: member.name.slice(0, 2).toUpperCase(),
        status: member.status,
      },
      dueSummary: {
        pendingAmount: toNumber(member.dues_pending),
        monthlyAmount: toNumber(member.monthly_amount),
        pendingMonths: Array.from(new Set(pendingMonths)),
        hasOverdue: toNumber(member.dues_pending) > 0,
      },
      recentActivity: ((recentResult.data ?? []) as PaymentRow[]).map(mapMemberActivity),
    };
  }
}
