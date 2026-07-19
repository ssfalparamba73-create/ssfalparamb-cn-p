import type { NextRequest } from "next/server";
import { getSupportService } from "@/lib/backend/composition/supportService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const actor = buildPublicActorContext(request);
  try {
    return createBackendResponse(
      await getSupportService().listActiveContacts(actor),
      actor.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), actor.requestId);
  }
}
