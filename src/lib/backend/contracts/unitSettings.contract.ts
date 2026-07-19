import type { ActorContext, BackendResult } from "./common.contract";
import type { UnitSettingsDTO } from "../dto/unitSettings.dto";

export type UpdateUnitSettingsInput = UnitSettingsDTO;

export interface UnitSettingsRepository {
  getUnitSettings(): Promise<UnitSettingsDTO>;
  updateUnitSettings(input: UpdateUnitSettingsInput, actor: ActorContext): Promise<UnitSettingsDTO>;
}

export interface UnitSettingsService {
  getUnitSettings(actor: ActorContext): Promise<BackendResult<UnitSettingsDTO>>;
  updateUnitSettings(
    input: UpdateUnitSettingsInput,
    actor: ActorContext
  ): Promise<BackendResult<UnitSettingsDTO>>;
}
