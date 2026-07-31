import type { AuthSessionDTO } from "@/lib/backend/dto/auth.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";
import { clearProtectedQueryCache } from "@/lib/client/queryCache";

export function loginMember(phone: string, pin: string): Promise<AuthSessionDTO> {
  clearProtectedQueryCache();
  return requestBackend<AuthSessionDTO>("/api/v1/auth/member/login", {
    method: "POST",
    body: JSON.stringify({ phone, pin }),
  });
}

export function loginAdmin(phone: string, code: string): Promise<AuthSessionDTO> {
  clearProtectedQueryCache();
  return requestBackend<AuthSessionDTO>("/api/v1/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export function getCurrentSession(): Promise<AuthSessionDTO> {
  return requestBackend<AuthSessionDTO>("/api/v1/auth/session");
}

export async function logoutSession(): Promise<void> {
  try {
    await requestBackendVoid("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearProtectedQueryCache();
  }
}
