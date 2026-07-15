import "server-only";

import { SupabaseAuditRepository } from "../adapters/supabase/repositories/supabaseAuditRepository";
import { createAuditService } from "../services/auditService";
import { AuditService } from "../contracts/admin.contract";

let auditServiceInstance: AuditService | null = null;

export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    const repo = new SupabaseAuditRepository();
    auditServiceInstance = createAuditService({ auditRepository: repo });
  }
  return auditServiceInstance;
}

