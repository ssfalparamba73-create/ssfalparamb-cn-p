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

type FinalPaymentRow = Omit<PaymentRow, "status"> & {
  status: Extract<PaymentStatus, "confirmed" | "failed">;
};

interface CashHandoverPaymentRow {
  id: string;
  amount: number | string;
  collected_by_admin_id: string | null;
  status: "pending" | "confirmed";
  recorded_at: string;
}

interface CashReceiverRow {
  id: string;
  name: string;
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

interface MonthlyCollectionRow {
  month_key: string;
  total_collected: number | string;
  monthly_dues: number | string;
  special_events: number | string;
  upi_amount: number | string;
  cash_amount: number | string;
  admin_amount: number | string;
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentDate(row: PaymentRow): string {
  return row.paid_at ?? row.recorded_at;
}

function mapRecentPayment(row: FinalPaymentRow): DashboardRecentPaymentDTO {
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

export class SupabaseDashboardRepository implements DashboardRepository {
  async getAdminDashboard(monthKey: string): Promise<AdminDashboardDTO> {
    const supabase = createSupabaseBackendClient();
    const year = Number(monthKey.slice(0, 4));

    const [
      collectionResult,
      membersResult,
      cashCountResult,
      recentPaymentsResult,
      recentCashResult,
    ] = await Promise.all([
      supabase.rpc("admin_dashboard_monthly_collections", { p_year: year }),
      supabase
        .from("members")
        .select("id,dues_pending,is_blood_donor,donor_available")
        .eq("status", "active"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("method", "cash_handover")
        .eq("status", "pending")
        .is("voided_at", null),
      supabase
        .from("payments")
        .select("id,receipt_id,payer_name,category,method,amount,status,paid_at,recorded_at")
        .in("status", ["confirmed", "failed"])
        .is("voided_at", null)
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("id,amount,collected_by_admin_id,status,recorded_at")
        .eq("method", "cash_handover")
        .in("status", ["pending", "confirmed"])
        .is("voided_at", null)
        .order("recorded_at", { ascending: false })
        .limit(5),
    ]);

    const firstError = [
      collectionResult.error,
      membersResult.error,
      cashCountResult.error,
      recentPaymentsResult.error,
      recentCashResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const recentCashPayments = (recentCashResult.data ?? []) as CashHandoverPaymentRow[];
    const receiverIds = Array.from(new Set(
      recentCashPayments
        .map((row) => row.collected_by_admin_id)
        .filter((id): id is string => Boolean(id))
    ));
    const receiverResult = receiverIds.length > 0
      ? await supabase.from("admin_users").select("id,name").in("id", receiverIds)
      : { data: [], error: null };
    if (receiverResult.error) throw receiverResult.error;
    const receiverNames = new Map(
      ((receiverResult.data ?? []) as CashReceiverRow[]).map((row) => [row.id, row.name])
    );

    const monthlyCollections = (collectionResult.data ?? []) as MonthlyCollectionRow[];
    const selectedMonth = monthlyCollections.find((row) => row.month_key === monthKey);
    const members = (membersResult.data ?? []) as Array<{
      id: string;
      dues_pending: number | string;
      is_blood_donor: boolean;
      donor_available: boolean;
    }>;

    const totalCollected = toNumber(selectedMonth?.total_collected);
    const monthlyDues = toNumber(selectedMonth?.monthly_dues);
    const specialEvents = toNumber(selectedMonth?.special_events);
    const pendingAmount = members.reduce((sum, row) => sum + toNumber(row.dues_pending), 0);
    const paidMembers = members.filter((row) => toNumber(row.dues_pending) <= 0).length;
    const defaulters = members.filter((row) => toNumber(row.dues_pending) > 0).length;
    const availableDonors = members.filter(
      (row) => row.is_blood_donor && row.donor_available
    ).length;

    const collectionTrend = monthlyCollections.map((row) => ({
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" })
        .format(new Date(`${row.month_key}-01T00:00:00Z`)),
      amount: toNumber(row.total_collected),
    }));

    const channelAmounts = new Map<string, number>([
      ["UPI", toNumber(selectedMonth?.upi_amount)],
      ["Cash", toNumber(selectedMonth?.cash_amount)],
      ["Admin", toNumber(selectedMonth?.admin_amount)],
    ]);

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
        yearCollected: monthlyCollections.reduce((sum, row) => sum + toNumber(row.total_collected), 0),
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
      recentPayments: ((recentPaymentsResult.data ?? []) as PaymentRow[])
        .filter((row): row is FinalPaymentRow => row.status === "confirmed" || row.status === "failed")
        .map(mapRecentPayment),
      recentCashHandovers: recentCashPayments.map(
        (row): DashboardRecentCashHandoverDTO => ({
          id: row.id,
          amount: toNumber(row.amount),
          adminName: receiverNames.get(row.collected_by_admin_id ?? "") ?? "Admin",
          date: row.recorded_at,
          status: row.status === "confirmed" ? "verified" : "pending",
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
        .is("voided_at", null)
        .order("recorded_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("payment_months(label,month_key)")
        .eq("member_id", memberId)
        .is("voided_at", null)
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
    const recentPayments = (recentResult.data ?? []) as PaymentRow[];
    const hasPendingPayment = recentPayments.some((payment) => payment.status === "pending");
    const hasFailedPayment = recentPayments.some((payment) => payment.status === "failed");
    const pendingAmount = toNumber(member.dues_pending);
    const paymentStatus = hasFailedPayment
      ? "payment_failed"
      : hasPendingPayment
        ? "payment_pending"
        : pendingAmount > 0
          ? "contribution_due"
          : "all_clear";

    return {
      member: {
        id: member.id,
        memberCode: member.member_code,
        name: member.name,
        initials: member.name.slice(0, 2).toUpperCase(),
        status: member.status,
      },
      dueSummary: {
        pendingAmount,
        monthlyAmount: toNumber(member.monthly_amount),
        pendingMonths: Array.from(new Set(pendingMonths)),
        hasOverdue: pendingAmount > 0,
        paymentStatus,
      },
      recentActivity: ((recentResult.data ?? []) as PaymentRow[]).map(mapMemberActivity),
    };
  }
}
