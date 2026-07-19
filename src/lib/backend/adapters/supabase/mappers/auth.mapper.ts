import type { AuthSessionDTO } from "../../../dto/auth.dto";

interface AuthSessionRow {
  actor_type: "member" | "admin";
  member_id: string | null;
  admin_id: string | null;
  expires_at: string;
}

export function mapAuthSessionRow(
  row: AuthSessionRow,
  actorName: string,
  actorRole?: string
): AuthSessionDTO {
  const actorId = row.actor_type === "member" ? row.member_id : row.admin_id;
  if (!actorId) {
    throw new Error("Auth session is missing its actor identity.");
  }

  return {
    actorType: row.actor_type,
    actorId,
    actorName,
    actorRole,
    expiresAt: row.expires_at,
  };
}
