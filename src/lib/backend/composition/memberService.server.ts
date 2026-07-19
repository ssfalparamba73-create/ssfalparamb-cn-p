import "server-only";
import { SupabaseMemberRepository } from "../adapters/supabase/repositories/supabaseMemberRepository";
import { createMemberService } from "../services/memberService";

export function getMemberService() {
  return createMemberService({
    memberRepository: new SupabaseMemberRepository(),
  });
}
