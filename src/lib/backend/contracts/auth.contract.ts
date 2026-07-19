import type { ActorContext, BackendResult, ISODateTime } from "./common.contract";
import type { AuthActorType, AuthSessionDTO, IssuedAuthSession } from "../dto/auth.dto";

export interface MemberLoginInput {
  phone: string;
  pin: string;
}

export interface AdminCodeLoginInput {
  phone: string;
  code: string;
}

export interface CredentialVerification {
  outcome: "success" | "invalid" | "locked";
  actorId?: string;
  actorName?: string;
}

export interface CreateAuthSessionInput {
  actorType: AuthActorType;
  actorId: string;
  actorName: string;
  tokenHash: string;
  expiresAt: ISODateTime;
  device?: string;
}

export interface AuthRepository {
  verifyCredential(
    actorType: AuthActorType,
    phone: string,
    code: string
  ): Promise<CredentialVerification>;
  createSession(input: CreateAuthSessionInput): Promise<AuthSessionDTO>;
  resolveSession(tokenHash: string): Promise<AuthSessionDTO | null>;
  revokeSession(tokenHash: string): Promise<void>;
}

export interface AuthService {
  loginMember(
    input: MemberLoginInput,
    actor: ActorContext
  ): Promise<BackendResult<IssuedAuthSession>>;
  loginAdmin(
    input: AdminCodeLoginInput,
    actor: ActorContext
  ): Promise<BackendResult<IssuedAuthSession>>;
  getCurrentSession(rawToken: string): Promise<BackendResult<AuthSessionDTO>>;
  logout(rawToken: string): Promise<BackendResult<void>>;
}
