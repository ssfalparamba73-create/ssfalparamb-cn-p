import type { ID, ISODateTime } from "../contracts/common.contract";

export interface SupportContactDTO {
  id: ID;
  name: string;
  role?: string;
  phone: string;
  email?: string;
  whatsappEnabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: ISODateTime;
}
