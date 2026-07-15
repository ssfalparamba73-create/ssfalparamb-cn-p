import { ISODateTime } from "../contracts/common.contract";

export type ActorType = "member" | "admin";

export interface SessionDTO {
  actorType: ActorType;
  actorId: string;
  name: string;
  expiresAt: ISODateTime;
}
