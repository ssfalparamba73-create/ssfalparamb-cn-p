import { createHash, randomBytes } from "node:crypto";
import type {
  AdminCodeLoginInput,
  AuthRepository,
  AuthService,
  MemberLoginInput,
} from "../contracts/auth.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { AuthActorType, IssuedAuthSession } from "../dto/auth.dto";
import { authError, rateLimitError } from "../errors/createBackendError";
import { ERROR_CODES } from "../errors/errorCodes";
import { emptyOk, fail, fromThrowable, ok } from "../errors/resultHelpers";
import { validateAdminCodeLoginInput, validateMemberLoginInput } from "../validation/authSchemas";

const SESSION_LIFETIME_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function createAuthService(deps: { authRepository: AuthRepository }): AuthService {
  const { authRepository } = deps;

  async function issueSession(
    actorType: AuthActorType,
    phone: string,
    code: string,
    actor: ActorContext
  ): Promise<BackendResult<IssuedAuthSession>> {
    try {
      const verification = await authRepository.verifyCredential(actorType, phone, code);
      if (verification.outcome === "locked") {
        return fail(rateLimitError());
      }

      if (
        verification.outcome !== "success" ||
        !verification.actorId ||
        !verification.actorName
      ) {
        return fail(authError("Invalid phone number or login code.", ERROR_CODES.INVALID_PIN));
      }

      const rawToken = randomBytes(32).toString("base64url");
      const session = await authRepository.createSession({
        actorType,
        actorId: verification.actorId,
        actorName: verification.actorName,
        tokenHash: hashSessionToken(rawToken),
        expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS).toISOString(),
        device: actor.device,
      });

      return ok({ session, rawToken });
    } catch (error) {
      return fail(fromThrowable(error));
    }
  }

  return {
    async loginMember(
      input: MemberLoginInput,
      actor: ActorContext
    ): Promise<BackendResult<IssuedAuthSession>> {
      const validation = validateMemberLoginInput(input);
      if (!validation.ok) return fail(validation.error!);
      return issueSession("member", validation.data!.phone, validation.data!.pin, actor);
    },

    async loginAdmin(
      input: AdminCodeLoginInput,
      actor: ActorContext
    ): Promise<BackendResult<IssuedAuthSession>> {
      const validation = validateAdminCodeLoginInput(input);
      if (!validation.ok) return fail(validation.error!);
      return issueSession("admin", validation.data!.phone, validation.data!.code, actor);
    },

    async getCurrentSession(rawToken: string) {
      try {
        if (!rawToken) return fail(authError("Login required."));
        const session = await authRepository.resolveSession(hashSessionToken(rawToken));
        if (!session) {
          return fail(authError("Session expired or invalid.", ERROR_CODES.SESSION_EXPIRED));
        }
        return ok(session);
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },

    async logout(rawToken: string) {
      try {
        if (rawToken) {
          await authRepository.revokeSession(hashSessionToken(rawToken));
        }
        return emptyOk();
      } catch (error) {
        return fail(fromThrowable(error));
      }
    },
  };
}
