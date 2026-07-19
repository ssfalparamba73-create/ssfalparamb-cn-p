import "server-only";
import { SupabaseAuthRepository } from "../adapters/supabase/repositories/supabaseAuthRepository";
import { createAuthService } from "../services/authService";

export function getAuthService() {
  return createAuthService({ authRepository: new SupabaseAuthRepository() });
}
