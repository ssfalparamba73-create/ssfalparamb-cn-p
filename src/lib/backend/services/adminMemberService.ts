import { randomInt } from "node:crypto";
import type { AdminMemberService } from "../contracts/admin.contract";
import type { MemberRepository, CreateMemberInput, UpdateMemberInput } from "../contracts/member.contract";
import type { ActorContext, BackendResult, PaginatedResult, PaginationInput } from "../contracts/common.contract";
import type { IssuedMemberPinDTO, MemberDTO, MemberListFilters } from "../dto/member.dto";
import { fail, ok, fromThrowable } from "../errors/resultHelpers";
import { authError, notFoundError, validationError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import {
  validateCreateMemberInput,
  validateMemberListFilters,
  validateUpdateMemberInput
} from "../validation/memberSchemas";
import { validatePagination } from "../validation/commonSchemas";
import { validateMemberInvitationTemplateInput } from "../validation/settingsSchemas";
import {
  MEMBER_INVITATION_DEFAULT_TEMPLATE,
  renderMemberInvitationTemplate,
} from "@/lib/memberInvitation";

export function createAdminMemberService(deps: {
  memberRepository: MemberRepository;
  getMemberInvitationTemplate: () => Promise<string | null>;
  requirePermission: (
    actor: ActorContext,
    permission: string
  ) => Promise<BackendResult<true>>;
}): AdminMemberService {
  const { memberRepository, getMemberInvitationTemplate, requirePermission } = deps;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return await requirePermission(actor, permission);
  }

  async function findMember(id: string): Promise<BackendResult<MemberDTO>> {
    if (!uuidPattern.test(id)) {
      return fail(validationError("Invalid member ID.", "id"));
    }
    const member = await memberRepository.findById(id);
    return member
      ? ok(member)
      : fail(notFoundError("Member not found.", ERROR_CODES.MEMBER_NOT_FOUND));
  }

  return {
    async getMember(id: string, actor: ActorContext): Promise<BackendResult<MemberDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.view");
        if (!accessCheck.ok) return fail(accessCheck.error!);
        return await findMember(id);
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

        const existing = await findMember(id);
        if (!existing.ok) return fail(existing.error!);
        if (existing.data!.status === "left") {
          return fail(validationError("A left member cannot be edited.", "id"));
        }

        const validation = validateUpdateMemberInput(input);
        if (!validation.ok) return fail(validation.error!);

        const member = await memberRepository.update(id, validation.data!, actor);
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

        const existing = await findMember(id);
        if (!existing.ok) return fail(existing.error!);

        await memberRepository.softDelete(id, actor);
        return ok(undefined);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },

    async issueMemberPin(
      id: string,
      actor: ActorContext
    ): Promise<BackendResult<IssuedMemberPinDTO>> {
      try {
        const accessCheck = await checkAccess(actor, "members.update");
        if (!accessCheck.ok) return fail(accessCheck.error!);

        const existing = await findMember(id);
        if (!existing.ok) return fail(existing.error!);
        if (existing.data!.status !== "active") {
          return fail(validationError("A login invitation can only be issued to an active member.", "id"));
        }

        const storedTemplate = await getMemberInvitationTemplate();
        const templateValidation = validateMemberInvitationTemplateInput({
          template: storedTemplate ?? MEMBER_INVITATION_DEFAULT_TEMPLATE,
        });
        const template = templateValidation.ok
          ? templateValidation.data!.template
          : MEMBER_INVITATION_DEFAULT_TEMPLATE;
        const pin = randomInt(0, 10_000).toString().padStart(4, "0");
        const issuedAt = await memberRepository.issuePin(id, pin, actor);
        return ok({
          memberId: id,
          memberName: existing.data!.name,
          phone: existing.data!.phone,
          pin,
          message: renderMemberInvitationTemplate(template, {
            name: existing.data!.name,
            phone: existing.data!.phone,
            pin,
          }),
          issuedAt,
        });
      } catch (err) {
        return fail(fromThrowable(err));
      }
    },
  };
}
