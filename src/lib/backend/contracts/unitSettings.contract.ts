import type { ActorContext, BackendResult } from "./common.contract";
import type { BlockOptionsDTO, UnitSettingsDTO } from "../dto/unitSettings.dto";

export type UpdateUnitSettingsInput = UnitSettingsDTO;

export interface UnitSettingsRepository {
  getUnitSettings(): Promise<UnitSettingsDTO>;
  getBlockOptions(): Promise<BlockOptionsDTO>;
  updateUnitSettings(input: UpdateUnitSettingsInput, actor: ActorContext): Promise<UnitSettingsDTO>;
}

export interface UnitSettingsService {
  getPublicBlockOptions(): Promise<BackendResult<BlockOptionsDTO>>;
  getUnitSettings(actor: ActorContext): Promise<BackendResult<UnitSettingsDTO>>;
  updateUnitSettings(
    input: UpdateUnitSettingsInput,
    actor: ActorContext
  ): Promise<BackendResult<UnitSettingsDTO>>;
}
