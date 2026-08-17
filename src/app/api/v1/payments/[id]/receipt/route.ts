import { NextRequest } from "next/server";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getReceiptService } from "@/lib/backend/composition/receiptService.server";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { serverError } from "@/lib/backend/errors/createBackendError";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = buildPublicActorContext(request);
  try {
    const { id } = await params;
    const authenticated = await resolveAuthenticatedActor(request, context.requestId);
    if (!authenticated.ok) return createBackendResponse(authenticated, context.requestId);
    return createBackendResponse(
      await getReceiptService().getReceiptForMember(id, authenticated.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
