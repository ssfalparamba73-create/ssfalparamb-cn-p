import type { AuthSessionDTO } from "@/lib/backend/dto/auth.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";

export function loginMember(phone: string, pin: string): Promise<AuthSessionDTO> {
  return requestBackend<AuthSessionDTO>("/api/v1/auth/member/login", {
    method: "POST",
    body: JSON.stringify({ phone, pin }),
  });
}

export function loginAdmin(phone: string, code: string): Promise<AuthSessionDTO> {
  return requestBackend<AuthSessionDTO>("/api/v1/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export function getCurrentSession(): Promise<AuthSessionDTO> {
  return requestBackend<AuthSessionDTO>("/api/v1/auth/session");
}

export function logoutSession(): Promise<void> {
  return requestBackendVoid("/api/v1/auth/logout", { method: "POST" });
}
