import type { ID, ISODateTime } from "../contracts/common.contract";

export type EventReceiptTheme = "default" | "amber";

export interface SpecialEventDTO {
  id: ID;
  name: string;
  description?: string;
  suggestedAmount?: number;
  minimumAmount: number;
  receiptTheme: EventReceiptTheme;
  isActive: boolean;
  startsAt?: ISODateTime;
  endsAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
