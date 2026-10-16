import type { NextRequest } from "next/server";
import { getPublicBannerService } from "@/lib/backend/composition/publicBannerService.server";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const response = createBackendResponse(
      await getPublicBannerService().getPublicBanner(),
      context.requestId
    );
    if (response.ok) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300"
      );
    }
    return response;
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
