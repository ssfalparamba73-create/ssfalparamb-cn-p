import "server-only";

import { SupabaseMemberRepository } from "../adapters/supabase/repositories/supabaseMemberRepository";
import { createMemberService } from "../services/memberService";
import { MemberService } from "../contracts/member.contract";

let memberServiceInstance: MemberService | null = null;

export function getMemberService(): MemberService {
  if (!memberServiceInstance) {
    const repo = new SupabaseMemberRepository();
    memberServiceInstance = createMemberService({ memberRepository: repo });
  }
  return memberServiceInstance;
}

