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

export class SupabaseAuthRepository implements AuthRepository {
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
    return mapAuthSessionRow(data as SessionRow, input.actorName, actorRole);
  }

  async resolveSession(tokenHash: string): Promise<AuthSessionDTO | null> {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("auth_sessions")
      .select("actor_type, member_id, admin_id, expires_at, revoked_at")
      .eq("session_token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const session = data as SessionRow;
    if (session.revoked_at || Date.parse(session.expires_at) <= Date.now()) {
      return null;
    }

    let actorName: string | null = null;
    let actorRole: string | undefined;
    if (session.actor_type === "member" && session.member_id) {
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("name, status, pin_status")
        .eq("id", session.member_id)
        .maybeSingle();
      if (memberError) throw memberError;
      if (!member || member.status !== "active" || member.pin_status !== "issued") return null;
      actorName = member.name;
    } else if (session.actor_type === "admin" && session.admin_id) {
      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("name, status")
        .eq("id", session.admin_id)
        .maybeSingle();
      if (adminError) throw adminError;
      if (!admin || admin.status !== "active") return null;
      actorName = admin.name;
      actorRole = await this.getAdminRole(session.admin_id);
    }

    if (!actorName) return null;

    const { error: touchError } = await supabase
      .from("auth_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("session_token_hash", tokenHash)
      .is("revoked_at", null);

    if (touchError) {
      console.warn("Auth session last-seen update failed.");
    }

    return mapAuthSessionRow(session, actorName, actorRole);
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
