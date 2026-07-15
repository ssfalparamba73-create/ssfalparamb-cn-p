import { NextRequest } from "next/server";
import { getReceiptService } from "../../../../../lib/backend/composition/receiptService.server";
import { buildPublicActorContext } from "../../../../../lib/backend/http/requestContext";
import { createBackendResponse } from "../../../../../lib/backend/http/backendResultResponse";
import { fail } from "../../../../../lib/backend/errors/resultHelpers";
import { validationError, serverError } from "../../../../../lib/backend/errors/createBackendError";

interface RouteParams {
  params: Promise<{
    receiptId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const actor = buildPublicActorContext(request);
  
  try {
    const { receiptId } = await params;
    
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      // Return 400 validation error without attempting lookup
      const errResult = fail(validationError("Missing token parameter."));
      return createBackendResponse(errResult, actor.requestId);
    }

    const receiptService = getReceiptService();
    const result = await receiptService.getReceiptByToken(receiptId, token, actor);

    return createBackendResponse(result, actor.requestId);
  } catch (err) {
    void err;
    console.error(`[${actor.requestId}] Unhandled receipt route error.`);
    // Convert unhandled crash to generic backend failure response
    const errResult = fail(serverError("An internal server error occurred."));
    return createBackendResponse(errResult, actor.requestId);
  }
}
