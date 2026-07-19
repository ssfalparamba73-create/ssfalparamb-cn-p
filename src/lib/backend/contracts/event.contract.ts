import type { ActorContext, BackendResult } from "./common.contract";
import type { EventReceiptTheme, SpecialEventDTO } from "../dto/event.dto";

export interface CreateSpecialEventInput {
  name: string;
  description?: string;
  suggestedAmount?: number;
  minimumAmount: number;
  receiptTheme: EventReceiptTheme;
  isActive: boolean;
}

export type UpdateSpecialEventInput = Partial<CreateSpecialEventInput>;

export interface EventRepository {
  list(): Promise<SpecialEventDTO[]>;
  create(input: CreateSpecialEventInput, actor: ActorContext): Promise<SpecialEventDTO>;
  update(id: string, input: UpdateSpecialEventInput, actor: ActorContext): Promise<SpecialEventDTO | null>;
  archive(id: string, actor: ActorContext): Promise<boolean>;
}

export interface EventService {
  list(actor: ActorContext): Promise<BackendResult<SpecialEventDTO[]>>;
  create(input: CreateSpecialEventInput, actor: ActorContext): Promise<BackendResult<SpecialEventDTO>>;
  update(
    id: string,
    input: UpdateSpecialEventInput,
    actor: ActorContext
  ): Promise<BackendResult<SpecialEventDTO>>;
  archive(id: string, actor: ActorContext): Promise<BackendResult<void>>;
}
