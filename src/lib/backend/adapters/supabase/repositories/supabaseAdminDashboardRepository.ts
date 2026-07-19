import type { ActorContext } from "../../../contracts/common.contract";
import type { AdminDashboardStatsDTO } from "../../../dto/admin.dto";
import type { AdminDashboardRepository } from "../../../services/adminDashboardService";
import { createSupabaseBackendClient } from "../client";

export class SupabaseAdminDashboardRepository implements AdminDashboardRepository {
  async getDashboardStats(actor: ActorContext): Promise<AdminDashboardStatsDTO> {
    const supabase = createSupabaseBackendClient();

    // In a real implementation, this might call a Supabase RPC or aggregate queries.
    // For now, we execute standard lightweight queries to map to the required DTO structure.

    // Fallback/stub structure that is type-safe
    const stats: AdminDashboardStatsDTO = {
      totalCollected: 0,
      monthlyDues: 0,
      specialEvents: 0,
      pendingAmount: 0,
      activeMembers: 0,
      paidMembers: 0,
      defaulters: 0,
      pendingCashHandovers: 0,
      availableDonors: 0,
      collectionTrend: [],
      paymentMethodSplit: [],
    };

    try {
      const { data: totals, error } = await supabase.rpc("get_dashboard_totals");
      if (error) throw error;

      if (totals) {
        stats.totalCollected = totals.total_collected || 0;
        stats.monthlyDues = totals.monthly_dues || 0;
        stats.specialEvents = totals.special_events || 0;
        stats.pendingAmount = totals.pending_amount || 0;
      }
    } catch (e) {
      throw new Error("Failed to fetch dashboard stats. RPC failed.");
    }

    return stats;
  }
}
