import { SupabaseClient } from "@supabase/supabase-js";
import { AuthRepository } from "../../../contracts/auth.contract";
import { SessionDTO, ActorType } from "../../../dto/auth.dto";
import { BackendResult } from "../../../contracts/common.contract";
import { ok, fail } from "../../../errors/resultHelpers";
import { authError, serverError } from "../../../errors/createBackendError";
import { ERROR_CODES } from "../../../errors/errorCodes";
import { mapToSessionDTO } from "../mappers/auth.mapper";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private supabase: SupabaseClient) {}

  async verifyMemberLogin(phone: string, pin: string): Promise<BackendResult<{ id: string; name: string }>> {
    const { data, error } = await this.supabase.rpc("verify_member_login", {
      p_phone: phone,
      p_pin: pin
    });

    if (error) {
      console.error("DB RPC error", error); return fail(serverError("Database error during verification"));
    }

    if (!data.success) {
      if (data.error === "TOO_MANY_ATTEMPTS") {
        return fail(authError("Too many failed attempts. Try again later.", ERROR_CODES.TOO_MANY_ATTEMPTS));
      }
      return fail(authError("Invalid credentials"));
    }

    return ok({ id: data.id, name: data.name });
  }

  async verifyAdminLogin(phone: string, code: string): Promise<BackendResult<{ id: string; name: string }>> {
    const { data, error } = await this.supabase.rpc("verify_admin_login", {
      p_phone: phone,
      p_code: code
    });

    if (error) {
      console.error("DB RPC error", error); return fail(serverError("Database error during verification"));
    }

    if (!data.success) {
      if (data.error === "TOO_MANY_ATTEMPTS") {
        return fail(authError("Too many failed attempts. Try again later.", ERROR_CODES.TOO_MANY_ATTEMPTS));
      }
      return fail(authError("Invalid credentials"));
    }

    return ok({ id: data.id, name: data.name });
  }

  async createSession(
    actorType: ActorType,
    actorId: string,
    tokenHash: string,
    expiresAt: Date,
    ip?: string,
    device?: string
  ): Promise<BackendResult<void>> {
    const { error } = await this.supabase.from("auth_sessions").insert({
      session_token_hash: tokenHash,
      actor_type: actorType,
      member_id: actorType === "member" ? actorId : null,
      admin_id: actorType === "admin" ? actorId : null,
      expires_at: expiresAt.toISOString(),
      ip,
      device
    });

    if (error) {
      return fail(serverError("Failed to create session"));
    }

    return ok(undefined);
  }

  async resolveSession(tokenHash: string): Promise<BackendResult<SessionDTO>> {
    // Need to fetch session + the active actor status to ensure they are still active.
    // Also touch last_seen_at
    const { data, error } = await this.supabase
      .from("auth_sessions")
      .select(`
        *,
        members:member_id(name, status),
        admin_users:admin_id(name, status)
      `)
      .eq("session_token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return fail(authError("Invalid or expired session"));
    }

    // Check active status
    if (data.actor_type === "member") {
      if (!data.members || data.members.status !== "active") {
        return fail(authError("Account inactive"));
      }
      data.actor_name = data.members.name;
    } else {
      if (!data.admin_users || data.admin_users.status !== "active") {
        return fail(authError("Account inactive"));
      }
      data.actor_name = data.admin_users.name;
    }

    // Touch last_seen_at best-effort (fire and forget)
    this.supabase.from("auth_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("session_token_hash", tokenHash)
      .then();

    return ok(mapToSessionDTO(data));
  }

  async revokeSession(tokenHash: string): Promise<BackendResult<void>> {
    const { error } = await this.supabase
      .from("auth_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_token_hash", tokenHash);

    if (error) {
      return fail(serverError("Failed to revoke session"));
    }

    return ok(undefined);
  }
}
