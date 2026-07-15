import "server-only";

import { SupabaseMemberRepository } from "../adapters/supabase/repositories/supabaseMemberRepository";
import { createAdminMemberService } from "../services/adminMemberService";
import { AdminMemberService } from "../contracts/admin.contract";
import { getAdminAuthService } from "./adminAuthService.server";

let adminMemberServiceInstance: AdminMemberService | null = null;

export function getAdminMemberService(): AdminMemberService {
  if (!adminMemberServiceInstance) {
    const repo = new SupabaseMemberRepository();
    adminMemberServiceInstance = createAdminMemberService({
      memberRepository: repo,
      requirePermission: (actor, permission) => getAdminAuthService().requirePermission(actor, permission),
    });
  }
  return adminMemberServiceInstance;
}

