import "server-only";
import { SupabaseAuditRepository } from "../adapters/supabase/repositories/supabaseAuditRepository";
import { SupabasePublicBannerRepository } from "../adapters/supabase/repositories/supabasePublicBannerRepository";
import { createPublicBannerService } from "../services/publicBannerService";

export function getPublicBannerService() {
  return createPublicBannerService({
    repository: new SupabasePublicBannerRepository(),
    auditRepository: new SupabaseAuditRepository(),
  });
}
