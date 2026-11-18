import type {
  AdminDashboardDTO,
  MemberDashboardViewDTO,
} from "@/lib/backend/dto/dashboard.dto";
import { requestBackend } from "./backendClient";

export function getAdminDashboard(monthKey: string): Promise<AdminDashboardDTO> {
  const params = new URLSearchParams({ month: monthKey });
  return requestBackend<AdminDashboardDTO>(`/api/v1/admin/dashboard?${params}`);
}

export function getMemberDashboard(): Promise<MemberDashboardViewDTO> {
  return requestBackend<MemberDashboardViewDTO>("/api/v1/member/dashboard");
}
