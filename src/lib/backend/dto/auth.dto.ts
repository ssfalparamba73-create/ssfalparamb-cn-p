import type { ID, ISODateTime } from "../contracts/common.contract";

export type AuthActorType = "member" | "admin";

export interface AuthSessionDTO {
  actorType: AuthActorType;
  actorId: ID;
  actorName: string;
  actorRole?: string;
  profileComplete?: boolean;
  expiresAt: ISODateTime;
}

export interface IssuedAuthSession {
  session: AuthSessionDTO;
  rawToken: string;
}
