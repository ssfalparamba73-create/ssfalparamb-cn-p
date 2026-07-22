import type {
  AuthRepository,
  CreateAuthSessionInput,
  CredentialVerification,
} from "../../../contracts/auth.contract";
import type { AuthActorType, AuthSessionDTO } from "../../../dto/auth.dto";
import { createSupabaseBackendClient } from "../client";
import { mapAuthSessionRow } from "../mappers/auth.mapper";

interface VerificationRow {
  outcome: "success" | "invalid" | "locked";
  actor_id: string | null;
  actor_name: string | null;
}

interface SessionRow {
  actor_type: AuthActorType;
  member_id: string | null;
  admin_id: string | null;
  expires_at: string;
  revoked_at: string | null;
}

interface AdminRoleRow {
  roles: { name: string } | { name: string }[] | null;
}

interface ResolvedSessionContextRow {
  actor_type: AuthActorType;
  actor_id: string;
  actor_name: string;
  actor_role: string | null;
  permissions: string[] | null;
  profile_complete: boolean | null;
  expires_at: string;
}

export class SupabaseAuthRepository implements AuthRepository {
  private async getMemberProfileComplete(memberId: string): Promise<boolean> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("members")
      .select("profile_completed_at")
      .eq("id", memberId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.profile_completed_at);
  }

  private async getAdminRole(adminId: string): Promise<string> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("admin_user_roles")
      .select("roles(name)")
      .eq("admin_id", adminId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const related = (data as AdminRoleRow | null)?.roles;
    const role = Array.isArray(related) ? related[0] : related;
    return role?.name ?? "Admin";
  }

  async verifyCredential(
    actorType: AuthActorType,
    phone: string,
    code: string
  ): Promise<CredentialVerification> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.rpc("verify_app_login", {
      p_actor_type: actorType,
      p_phone: phone,
      p_code: code,
    });

    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as VerificationRow | null;
    if (!row) throw new Error("Login verification returned no result.");

    return {
      outcome: row.outcome,
      actorId: row.actor_id ?? undefined,
      actorName: row.actor_name ?? undefined,
    };
  }

  async createSession(input: CreateAuthSessionInput): Promise<AuthSessionDTO> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("auth_sessions")
      .insert({
        session_token_hash: input.tokenHash,
        actor_type: input.actorType,
        member_id: input.actorType === "member" ? input.actorId : null,
        admin_id: input.actorType === "admin" ? input.actorId : null,
        expires_at: input.expiresAt,
        device: input.device?.slice(0, 200),
      })
      .select("actor_type, member_id, admin_id, expires_at")
      .single();

    if (error || !data) throw error ?? new Error("Failed to create auth session.");
    const actorRole = input.actorType === "admin"
      ? await this.getAdminRole(input.actorId)
      : undefined;
    const profileComplete = input.actorType === "member"
      ? await this.getMemberProfileComplete(input.actorId)
      : undefined;
    return mapAuthSessionRow(data as SessionRow, input.actorName, actorRole, profileComplete);
  }

  async resolveSession(tokenHash: string): Promise<AuthSessionDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .rpc("resolve_app_session_context", { p_session_token_hash: tokenHash });

    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as ResolvedSessionContextRow | null;
    if (!row) return null;

    const session: SessionRow = {
      actor_type: row.actor_type,
      member_id: row.actor_type === "member" ? row.actor_id : null,
      admin_id: row.actor_type === "admin" ? row.actor_id : null,
      expires_at: row.expires_at,
      revoked_at: null,
    };

    return mapAuthSessionRow(
      session,
      row.actor_name,
      row.actor_role ?? undefined,
      row.profile_complete ?? undefined,
      row.permissions ?? []
    );
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase
      .from("auth_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("session_token_hash", tokenHash)
      .is("revoked_at", null);

    if (error) throw error;
  }
}
