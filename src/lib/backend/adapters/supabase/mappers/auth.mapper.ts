import { SessionDTO } from "../../../dto/auth.dto";

export function mapToSessionDTO(row: any): SessionDTO {
  return {
    actorType: row.actor_type,
    actorId: row.actor_type === 'member' ? row.member_id : row.admin_id,
    name: row.actor_name, // Extracted via join or similar in repo
    expiresAt: new Date(row.expires_at).toISOString()
  };
}
