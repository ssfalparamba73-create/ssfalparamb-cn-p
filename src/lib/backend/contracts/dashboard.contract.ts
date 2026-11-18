import type { ActorContext, BackendResult } from "./common.contract";
import type { AdminDashboardDTO, MemberDashboardViewDTO } from "../dto/dashboard.dto";

export interface DashboardRepository {
  getAdminDashboard(monthKey: string): Promise<AdminDashboardDTO>;
  getMemberDashboard(memberId: string): Promise<MemberDashboardViewDTO | null>;
}

export interface DashboardService {
  getAdminDashboard(actor: ActorContext, monthKey: string): Promise<BackendResult<AdminDashboardDTO>>;
  getMemberDashboard(actor: ActorContext): Promise<BackendResult<MemberDashboardViewDTO>>;
}
