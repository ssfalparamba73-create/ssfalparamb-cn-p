import type {
  AdminDashboardDTO,
  MemberDashboardViewDTO,
} from "@/lib/backend/dto/dashboard.dto";
import { requestBackend } from "./backendClient";

export function getAdminDashboard(): Promise<AdminDashboardDTO> {
  return requestBackend<AdminDashboardDTO>("/api/v1/admin/dashboard");
}

export function getMemberDashboard(): Promise<MemberDashboardViewDTO> {
  return requestBackend<MemberDashboardViewDTO>("/api/v1/member/dashboard");
}
