import "server-only";

import { SupabaseAdminRepository } from "../adapters/supabase/repositories/supabaseAdminRepository";
import { createAdminAuthService } from "../services/adminAuthService";
import { AdminAuthService } from "../contracts/admin.contract";

let adminAuthServiceInstance: AdminAuthService | null = null;

export function getAdminAuthService(): AdminAuthService {
  if (!adminAuthServiceInstance) {
    const adminRepo = new SupabaseAdminRepository();
    adminAuthServiceInstance = createAdminAuthService({ adminRepository: adminRepo });
  }
  return adminAuthServiceInstance;
}

