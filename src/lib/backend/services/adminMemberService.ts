import type { AdminMemberService } from "../contracts/admin.contract";
import type { MemberRepository, CreateMemberInput, ResetMemberPinInput, UpdateMemberInput } from "../contracts/member.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { MemberDTO, MemberListFilters } from "../dto/member.dto";
import { fail, ok, fromThrowable } from "../errors/resultHelpers";
import { authError } from "../errors/createBackendError";
import { 
  validateCreateMemberInput, 
  validateMemberListFilters, 
  validateUpdateMemberInput 
} from "../validation/memberSchemas";
import { validatePagination, validatePin } from "../validation/commonSchemas";

import { notFoundError } from "../errors/createBackendError";
export function createAdminMemberService(deps: {
  memberRepository: MemberRepository;
  requirePermission?: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): AdminMemberService {
  const { memberRepository, requirePermission } = deps;

  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    if (requirePermission) {
      return await requirePermission(actor, permission);
    }
    return ok(true);
  }

  return {
    async getMemberDetail(id: string, actor: ActorContext): Promise<BackendResult<MemberDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.view");
        if (!accessCheck.ok) return fail(accessCheck.error!);
        const member = await memberRepository.findById(id);
        if (!member) return fail(notFoundError("Member not found", "MEMBER_NOT_FOUND"));
        return ok(member);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },
    async listMembers(
      filters: MemberListFilters, 
      pagination: PaginationInput, 
      actor: ActorContext
    ): Promise<BackendResult<PaginatedResult<MemberDTO>>> {
      try {
        const accessCheck = await checkAccess(actor, "members.view");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const filterValidation = validateMemberListFilters(filters);
        if (!filterValidation.ok) return fail(filterValidation.error!);

        const validPagination = validatePagination(pagination);
        
        const result = await memberRepository.list(filterValidation.data!, validPagination);
        return ok(result);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async createMember(
      input: CreateMemberInput, 
      actor: ActorContext
    ): Promise<BackendResult<MemberDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.create");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validateCreateMemberInput(input);
        if (!validation.ok) return fail(validation.error!);

        const member = await memberRepository.create(validation.data!, actor);
        return ok(member);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async updateMember(
      id: string, 
      input: UpdateMemberInput, 
      actor: ActorContext
    ): Promise<BackendResult<MemberDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.update");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const validation = validateUpdateMemberInput(input);
        if (!validation.ok) return fail(validation.error!);

        const member = await memberRepository.update(id, validation.data!, actor);
        return ok(member);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async resetMemberPin(
      id: string,
      input: ResetMemberPinInput,
      actor: ActorContext
    ): Promise<BackendResult<MemberDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.update");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const pinValidation = validatePin(input?.pin);
        if (!pinValidation.ok) return fail(pinValidation.error!);

        const member = await memberRepository.resetPin(id, {
          pin: pinValidation.data!,
          forceReset: input.forceReset === true,
        }, actor);
        return ok(member);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async softDeleteMember(
      id: string, 
      actor: ActorContext
    ): Promise<BackendResult<void>> {
      try {
        const accessCheck = await checkAccess(actor, "members.delete");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        await memberRepository.softDelete(id, actor);
        return ok(undefined);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}

