import { ActorContext, BackendResult } from "./common.contract";
import { SessionDTO, ActorType } from "../dto/auth.dto";

export interface AuthRepository {
  verifyMemberLogin(phone: string, pin: string): Promise<BackendResult<{ id: string; name: string }>>;
  verifyAdminLogin(phone: string, code: string): Promise<BackendResult<{ id: string; name: string }>>;
  createSession(actorType: ActorType, actorId: string, tokenHash: string, expiresAt: Date, ip?: string, device?: string): Promise<BackendResult<void>>;
  resolveSession(tokenHash: string): Promise<BackendResult<SessionDTO>>;
  revokeSession(tokenHash: string): Promise<BackendResult<void>>;
}

export interface AuthService {
  loginMember(phone: string, pin: string, ip?: string, device?: string): Promise<BackendResult<{ rawToken: string; session: SessionDTO }>>;
  loginAdmin(phone: string, code: string, ip?: string, device?: string): Promise<BackendResult<{ rawToken: string; session: SessionDTO }>>;
  getCurrentActor(token: string): Promise<BackendResult<ActorContext>>;
  logout(token: string): Promise<BackendResult<void>>;
}
