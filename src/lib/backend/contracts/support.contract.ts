import type { ActorContext, BackendResult } from "./common.contract";
import type { SupportContactDTO } from "../dto/support.dto";

export interface CreateSupportContactInput {
  name: string;
  role: string;
  phone: string;
  email?: string;
  whatsappEnabled: boolean;
  isPrimary?: boolean;
  isActive: boolean;
}

export type UpdateSupportContactInput = Partial<CreateSupportContactInput>;

export interface SupportRepository {
  listActiveContacts(): Promise<SupportContactDTO[]>;
  listAdminContacts(): Promise<SupportContactDTO[]>;
  create(input: CreateSupportContactInput, actor: ActorContext): Promise<SupportContactDTO>;
  update(id: string, input: UpdateSupportContactInput, actor: ActorContext): Promise<SupportContactDTO | null>;
  archive(id: string, actor: ActorContext): Promise<boolean>;
  reorder(ids: string[], actor: ActorContext): Promise<void>;
}

export interface SupportService {
  listActiveContacts(actor: ActorContext): Promise<BackendResult<SupportContactDTO[]>>;
  listAdminContacts(actor: ActorContext): Promise<BackendResult<SupportContactDTO[]>>;
  createContact(
    input: CreateSupportContactInput,
    actor: ActorContext
  ): Promise<BackendResult<SupportContactDTO>>;
  updateContact(
    id: string,
    input: UpdateSupportContactInput,
    actor: ActorContext
  ): Promise<BackendResult<SupportContactDTO>>;
  archiveContact(id: string, actor: ActorContext): Promise<BackendResult<void>>;
  reorderContacts(ids: string[], actor: ActorContext): Promise<BackendResult<void>>;
}
