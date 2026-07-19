import type { ActorContext, BackendResult } from "./common.contract";
import type { AdminDashboardDTO, MemberDashboardViewDTO } from "../dto/dashboard.dto";

export interface DashboardRepository {
  getAdminDashboard(): Promise<AdminDashboardDTO>;
  getMemberDashboard(memberId: string): Promise<MemberDashboardViewDTO | null>;
}

export interface DashboardService {
  getAdminDashboard(actor: ActorContext): Promise<BackendResult<AdminDashboardDTO>>;
  getMemberDashboard(actor: ActorContext): Promise<BackendResult<MemberDashboardViewDTO>>;
}
