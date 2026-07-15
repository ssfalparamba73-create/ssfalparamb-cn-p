import { AuthService, AuthRepository } from "../contracts/auth.contract";
import { BackendResult, ActorContext } from "../contracts/common.contract";
import { SessionDTO } from "../dto/auth.dto";
import { ok, fail } from "../errors/resultHelpers";
import { validationError, authError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import { validatePhone } from "../validation/commonSchemas";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class DefaultAuthService implements AuthService {
  constructor(private repo: AuthRepository) {}

  private async generateToken(): Promise<{ raw: string; hash: string }> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const raw = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Hash it for storage
    const msgBuffer = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { raw, hash };
  }

  async loginMember(phone: string, pin: string, ip?: string, device?: string): Promise<BackendResult<{ rawToken: string; session: SessionDTO }>> {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.ok) {
      return fail(phoneValidation.error!);
    }

    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return fail(validationError("PIN must be exactly 4 digits", "pin", ERROR_CODES.INVALID_PIN));
    }

    const verifyResult = await this.repo.verifyMemberLogin(phoneValidation.data!, pin);
    if (!verifyResult.ok) return fail(verifyResult.error!);

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    const { raw, hash } = await this.generateToken();

    const createResult = await this.repo.createSession("member", verifyResult.data!.id, hash, expiresAt, ip, device);
    if (!createResult.ok) return fail(createResult.error!);

    return ok({
      rawToken: raw,
      session: {
        actorType: "member",
        actorId: verifyResult.data!.id,
        name: verifyResult.data!.name,
        expiresAt: expiresAt.toISOString()
      }
    });
  }

  async loginAdmin(phone: string, code: string, ip?: string, device?: string): Promise<BackendResult<{ rawToken: string; session: SessionDTO }>> {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.ok) {
      return fail(phoneValidation.error!);
    }

    if (typeof code !== "string" || !/^\d{4,8}$/.test(code)) {
      return fail(validationError("Invalid code format", "code", ERROR_CODES.INVALID_PIN));
    }

    const verifyResult = await this.repo.verifyAdminLogin(phoneValidation.data!, code);
    if (!verifyResult.ok) return fail(verifyResult.error!);

    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    const { raw, hash } = await this.generateToken();

    const createResult = await this.repo.createSession("admin", verifyResult.data!.id, hash, expiresAt, ip, device);
    if (!createResult.ok) return fail(createResult.error!);

    return ok({
      rawToken: raw,
      session: {
        actorType: "admin",
        actorId: verifyResult.data!.id,
        name: verifyResult.data!.name,
        expiresAt: expiresAt.toISOString()
      }
    });
  }

  async getCurrentActor(token: string): Promise<BackendResult<ActorContext>> {
    if (!token) {
      return fail(authError("No session token provided"));
    }

    // Hash the token
    const msgBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const sessionResult = await this.repo.resolveSession(hash);
    if (!sessionResult.ok) return fail(sessionResult.error!);

    const session = sessionResult.data!;

    return ok({
      actorType: session.actorType,
      memberId: session.actorType === "member" ? session.actorId : undefined,
      adminId: session.actorType === "admin" ? session.actorId : undefined,
      actorName: session.name,
      requestId: "" // To be filled by HTTP context
    });
  }

  async logout(token: string): Promise<BackendResult<void>> {
    if (!token) return ok(undefined);
    
    const msgBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return this.repo.revokeSession(hash);
  }
}
