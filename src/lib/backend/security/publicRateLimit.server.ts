import "server-only";

import { createHmac } from "node:crypto";
import { createSupabaseBackendClient } from "../adapters/supabase/client";

/** Apply a database-backed fixed-window limit without storing the source value. */
export async function consumePublicRateLimit(
  action: string,
  subject: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const normalizedSubject = subject.trim().toLowerCase();
  if (!action || action.length > 64 || !normalizedSubject || normalizedSubject.length > 256) {
    return false;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Supabase service configuration is required for public rate limiting.");
  const keyHash = createHmac("sha256", key)
    .update(`${action}\0${normalizedSubject}`, "utf8")
    .digest("hex");

  const { data, error } = await createSupabaseBackendClient().rpc("consume_public_rate_limit", {
    p_action: action,
    p_key_hash: keyHash,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
