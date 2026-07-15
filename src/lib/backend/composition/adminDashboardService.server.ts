import "server-only";

import { SupabaseAdminDashboardRepository } from "../adapters/supabase/repositories/supabaseAdminDashboardRepository";
import { createAdminDashboardService } from "../services/adminDashboardService";
import { AdminDashboardService } from "../contracts/admin.contract";

let adminDashboardServiceInstance: AdminDashboardService | null = null;

export function getAdminDashboardService(): AdminDashboardService {
  if (!adminDashboardServiceInstance) {
    const repo = new SupabaseAdminDashboardRepository();
    adminDashboardServiceInstance = createAdminDashboardService({ dashboardRepository: repo });
  }
  return adminDashboardServiceInstance;
}

