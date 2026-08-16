import type { AuthSessionDTO } from "@/lib/backend/dto/auth.dto";
import { requestBackend, requestBackendVoid } from "./backendClient";
import { clearProtectedQueryCache } from "@/lib/client/queryCache";
import { clearAppQueryCache, setAppQueryData } from "@/lib/client/appQueryClient";

function clearAuthCaches(): void {
  clearProtectedQueryCache();
  clearAppQueryCache();
}

export async function loginMember(phone: string, pin: string): Promise<AuthSessionDTO> {
  clearAuthCaches();
  const session = await requestBackend<AuthSessionDTO>("/api/v1/auth/member/login", {
    method: "POST",
    body: JSON.stringify({ phone, pin }),
  });
  setAppQueryData(["auth", "session"], session);
  return session;
}

export async function loginAdmin(phone: string, code: string): Promise<AuthSessionDTO> {
  clearAuthCaches();
  const session = await requestBackend<AuthSessionDTO>("/api/v1/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  setAppQueryData(["auth", "session"], session);
  return session;
}

export function getCurrentSession(): Promise<AuthSessionDTO> {
  return requestBackend<AuthSessionDTO>("/api/v1/auth/session");
}

export async function logoutSession(): Promise<void> {
  try {
    await requestBackendVoid("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearAuthCaches();
  }
}
