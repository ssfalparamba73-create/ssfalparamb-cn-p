import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type {
  UnitSettingsRepository,
  UnitSettingsService,
  UpdateUnitSettingsInput,
} from "../contracts/unitSettings.contract";
import type { UnitSettingsDTO } from "../dto/unitSettings.dto";
import { authError } from "../errors/createBackendError";
import { fail, fromThrowable, ok } from "../errors/resultHelpers";
import { validateUpdateUnitSettingsInput } from "../validation/unitSettingsSchemas";

export function createUnitSettingsService(deps: {
  repository: UnitSettingsRepository;
  requirePermission: (actor: ActorContext, permission: string) => Promise<BackendResult<true>>;
}): UnitSettingsService {
  async function checkAccess(actor: ActorContext, permission: string): Promise<BackendResult<true>> {
    if (actor.actorType !== "admin" || !actor.adminId) {
      return fail(authError("Admin access required."));
    }
    return deps.requirePermission(actor, permission);
  }

  return {
    async getUnitSettings(actor: ActorContext): Promise<BackendResult<UnitSettingsDTO>> {
      try {
        const access = await checkAccess(actor, "settings.view");
        if (!access.ok) return fail(access.error!);
        return ok(await deps.repository.getUnitSettings());
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async updateUnitSettings(
      input: UpdateUnitSettingsInput,
      actor: ActorContext
    ): Promise<BackendResult<UnitSettingsDTO>> {
      try {
        const access = await checkAccess(actor, "settings.update");
        if (!access.ok) return fail(access.error!);
        const validation = validateUpdateUnitSettingsInput(input);
        if (!validation.ok) return fail(validation.error!);
        return ok(await deps.repository.updateUnitSettings(validation.data!, actor));
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
