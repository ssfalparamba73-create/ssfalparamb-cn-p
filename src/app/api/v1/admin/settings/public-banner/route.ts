import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { getPublicBannerService } from "@/lib/backend/composition/publicBannerService.server";
import { serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);
    return createBackendResponse(
      await getPublicBannerService().getAdminBanner(actor.data!),
      context.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actor = await resolveAuthenticatedActor(request, context.requestId);
    if (!actor.ok) return createBackendResponse(actor, context.requestId);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return createBackendResponse(
        fail(validationError("Request must contain multipart form data.", "file")),
        context.requestId
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return createBackendResponse(
        fail(validationError("Choose an image to upload.", "file")),
        context.requestId
      );
    }
    if (file.size > MAX_BYTES) {
      return createBackendResponse(
        fail(validationError("Image must be 5 MB or smaller.", "file")),
        context.requestId
      );
    }

    const result = await getPublicBannerService().uploadBanner(
      {
        bytes: new Uint8Array(await file.arrayBuffer()),
        mimeType: file.type,
        originalName: file.name,
      },
      actor.data!
    );
    return createBackendResponse(result, context.requestId, 201);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
