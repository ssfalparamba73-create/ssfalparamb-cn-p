import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type {
  CreateSpecialEventInput,
  EventRepository,
  EventService,
  UpdateSpecialEventInput,
} from "../contracts/event.contract";
import type { SpecialEventDTO } from "../dto/event.dto";
import { authError, validationError } from "../errors/createBackendError";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";
import {
  validateCreateSpecialEventInput,
  validateEventId,
  validateUpdateSpecialEventInput,
} from "../validation/eventSchemas";

export function createEventService(deps: {
  repository: EventRepository;
  requirePermission: (actor: ActorContext, permission: string) => Promise<BackendResult<true>>;
}): EventService {
  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return deps.requirePermission(actor, permission);
  }

  return {
    async list(actor: ActorContext): Promise<BackendResult<SpecialEventDTO[]>> {
      try {
        const access = await checkAccess(actor, "settings.view");
        if (!access.ok) return fail(access.error!);
        return ok(await deps.repository.list());
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async create(
      input: CreateSpecialEventInput,
      actor: ActorContext
    ): Promise<BackendResult<SpecialEventDTO>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const validation = validateCreateSpecialEventInput(input);
        if (!validation.ok) return fail(validation.error!);
        return ok(await deps.repository.create(validation.data!, actor));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async update(
      id: string,
      input: UpdateSpecialEventInput,
      actor: ActorContext
    ): Promise<BackendResult<SpecialEventDTO>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const idValidation = validateEventId(id);
        if (!idValidation.ok) return fail(idValidation.error!);
        const inputValidation = validateUpdateSpecialEventInput(input);
        if (!inputValidation.ok) return fail(inputValidation.error!);
        const event = await deps.repository.update(id, inputValidation.data!, actor);
        return event
          ? ok(event)
          : fail(validationError("Special event was not found.", "id"));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async archive(id: string, actor: ActorContext): Promise<BackendResult<void>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const idValidation = validateEventId(id);
        if (!idValidation.ok) return fail(idValidation.error!);
        const archived = await deps.repository.archive(id, actor);
        return archived
          ? ok(undefined)
          : fail(validationError("Special event was not found.", "id"));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
