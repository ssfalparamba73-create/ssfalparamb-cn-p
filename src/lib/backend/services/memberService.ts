import type { CompleteMemberProfileInput, MemberService, MemberRepository, UpdateMemberProfileInput } from "../contracts/member.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { MemberDashboardDTO, MemberDirectoryItemDTO, MemberListFilters, MemberProfileDTO } from "../dto/member.dto";
import { authError, notFoundError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { validateCompleteMemberProfileInput, validateUpdateMemberProfileInput, validateMemberListFilters } from "../validation/memberSchemas";
import { validatePagination } from "../validation/commonSchemas";

export function createMemberService(deps: {
  memberRepository: MemberRepository;
}): MemberService {
  const { memberRepository } = deps;

  function requireMember(actor: ActorContext): BackendResult<string> {
    if (!actor.memberId) {
      return fail(authError("Member login required."));
    }
    return ok(actor.memberId);
  }

  function requireMemberOrAdmin(actor: ActorContext): BackendResult<true> {
    if (actor.actorType !== "member" && actor.actorType !== "admin") {
      return fail(authError("Access denied. Member or admin only."));
    }
    return ok(true);
  }

  return {
    async getCurrentMemberProfile(actor: ActorContext): Promise<BackendResult<MemberProfileDTO>> {
      try {
        const memberIdCheck = requireMember(actor);
        if (!memberIdCheck.ok) return fail(memberIdCheck.error!);
        
        const profile = await memberRepository.getProfile(memberIdCheck.data!);
        if (!profile) {
          return fail(notFoundError("Profile not found.", "MEMBER_NOT_FOUND"));
        }
        
        return ok(profile);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async getDashboard(actor: ActorContext): Promise<BackendResult<MemberDashboardDTO>> {
      try {
        const memberIdCheck = requireMember(actor);
        if (!memberIdCheck.ok) return fail(memberIdCheck.error!);

        const dashboard = await memberRepository.getDashboard(memberIdCheck.data!);
        return ok(dashboard);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async updateProfile(input: UpdateMemberProfileInput, actor: ActorContext): Promise<BackendResult<MemberProfileDTO>> {
      try {
        const memberIdCheck = requireMember(actor);
        if (!memberIdCheck.ok) return fail(memberIdCheck.error!);

        const validation = validateUpdateMemberProfileInput(input);
        if (!validation.ok) return fail(validation.error!);

        const updated = await memberRepository.updateProfile(memberIdCheck.data!, validation.data!, actor);
        return ok(updated);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async completeProfile(input: CompleteMemberProfileInput, actor: ActorContext): Promise<BackendResult<MemberProfileDTO>> {
      try {
        const memberIdCheck = requireMember(actor);
        if (!memberIdCheck.ok) return fail(memberIdCheck.error!);

        const validation = validateCompleteMemberProfileInput(input);
        if (!validation.ok) return fail(validation.error!);

        const updated = await memberRepository.completeProfile(
          memberIdCheck.data!,
          validation.data!,
          actor
        );
        return ok(updated);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async listDirectory(
      filters: MemberListFilters,
      pagination: PaginationInput,
      actor: ActorContext
    ): Promise<BackendResult<PaginatedResult<MemberDirectoryItemDTO>>> {
      try {
        const accessCheck = requireMemberOrAdmin(actor);
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const filterValidation = validateMemberListFilters(filters);
        if (!filterValidation.ok) return fail(filterValidation.error!);

        const validPagination = validatePagination(pagination);

        const result = await memberRepository.listDirectory(filterValidation.data!, validPagination);
        return ok(result);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
