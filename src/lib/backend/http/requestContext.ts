import type { NextRequest } from "next/server";
import type { ActorContext } from "../contracts/common.contract";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Parses and sanitizes the request context to build a public ActorContext.
 * Generates a unique request ID for tracing.
 */
export function buildPublicActorContext(req: NextRequest): ActorContext {
  // Use crypto.randomUUID() as requested by Phase 6 plan
  const inboundReqId = req.headers.get("x-request-id");
  const requestId = inboundReqId && UUID_PATTERN.test(inboundReqId)
    ? inboundReqId 
    : crypto.randomUUID();

  // Sanitize User Agent
  const userAgent = req.headers.get("user-agent")?.substring(0, 200) || "unknown";

  return {
    actorType: "public",
    requestId,
    device: userAgent
  };
}
