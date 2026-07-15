import "server-only";

import { createSupabaseBackendClient } from "../adapters/supabase/client";
import { SupabaseAuthRepository } from "../adapters/supabase/repositories/supabaseAuthRepository";
import { DefaultAuthService } from "../services/authService";
import { AuthService } from "../contracts/auth.contract";

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const supabase = createSupabaseBackendClient();
    const repo = new SupabaseAuthRepository(supabase);
    authServiceInstance = new DefaultAuthService(repo);
  }
  return authServiceInstance;
}


