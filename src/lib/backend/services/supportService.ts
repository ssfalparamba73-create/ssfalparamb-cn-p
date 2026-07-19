import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type {
  CreateSupportContactInput,
  SupportRepository,
  SupportService,
  UpdateSupportContactInput,
} from "../contracts/support.contract";
import type { SupportContactDTO } from "../dto/support.dto";
import { authError, validationError } from "../errors/createBackendError";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";
import {
  validateCreateSupportContactInput,
  validateSupportContactId,
  validateSupportContactOrder,
  validateUpdateSupportContactInput,
} from "../validation/supportSchemas";

export function createSupportService(deps: {
  supportRepository: SupportRepository;
  requirePermission: (actor: ActorContext, permission: string) => Promise<BackendResult<true>>;
}): SupportService {
  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return deps.requirePermission(actor, permission);
  }

  return {
    async listActiveContacts() {
      try {
        return ok(await deps.supportRepository.listActiveContacts());
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async listAdminContacts(actor: ActorContext): Promise<BackendResult<SupportContactDTO[]>> {
      try {
        const access = await checkAccess(actor, "settings.view");
        if (!access.ok) return fail(access.error!);
        return ok(await deps.supportRepository.listAdminContacts());
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async createContact(
      input: CreateSupportContactInput,
      actor: ActorContext
    ): Promise<BackendResult<SupportContactDTO>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const validation = validateCreateSupportContactInput(input);
        if (!validation.ok) return fail(validation.error!);
        return ok(await deps.supportRepository.create(validation.data!, actor));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async updateContact(
      id: string,
      input: UpdateSupportContactInput,
      actor: ActorContext
    ): Promise<BackendResult<SupportContactDTO>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const idValidation = validateSupportContactId(id);
        if (!idValidation.ok) return fail(idValidation.error!);
        const inputValidation = validateUpdateSupportContactInput(input);
        if (!inputValidation.ok) return fail(inputValidation.error!);
        const contact = await deps.supportRepository.update(id, inputValidation.data!, actor);
        return contact
          ? ok(contact)
          : fail(validationError("Support contact was not found.", "id"));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async archiveContact(id: string, actor: ActorContext): Promise<BackendResult<void>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const idValidation = validateSupportContactId(id);
        if (!idValidation.ok) return fail(idValidation.error!);
        const archived = await deps.supportRepository.archive(id, actor);
        return archived
          ? ok(undefined)
          : fail(validationError("Support contact was not found.", "id"));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async reorderContacts(ids: string[], actor: ActorContext): Promise<BackendResult<void>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const validation = validateSupportContactOrder(ids);
        if (!validation.ok) return fail(validation.error!);
        await deps.supportRepository.reorder(validation.data!, actor);
        return ok(undefined);
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
