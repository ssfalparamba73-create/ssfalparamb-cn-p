import type { NextRequest } from "next/server";
import { SupabaseAdminRepository } from "@/lib/backend/adapters/supabase/repositories/supabaseAdminRepository";
import { SupabaseAuditRepository } from "@/lib/backend/adapters/supabase/repositories/supabaseAuditRepository";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { permissionError, serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

const EXPORT_PERMISSION = "reports.export";

export async function POST(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const actorResult = await resolveAuthenticatedActor(request, context.requestId);
    if (!actorResult.ok || !actorResult.data) {
      return createBackendResponse(actorResult, context.requestId);
    }

    const actor = actorResult.data;
    if (actor.actorType !== "admin" || !actor.adminId) {
      return createBackendResponse(fail(permissionError("Admin access required.")), context.requestId);
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return createBackendResponse(fail(validationError("Invalid export request.")), context.requestId);
    }

    const payload = body as Record<string, unknown>;
    if (payload.phase !== "authorize" && payload.phase !== "complete") {
      return createBackendResponse(fail(validationError("Invalid export request phase.", "phase")), context.requestId);
    }

    const permissions = actor.permissions ?? await new SupabaseAdminRepository().getAdminPermissions(actor.adminId);
    if (!permissions.includes(EXPORT_PERMISSION)) {
      return createBackendResponse(fail(permissionError(`Permission denied: requires ${EXPORT_PERMISSION}`)), context.requestId);
    }

    if (payload.phase === "authorize") {
      return createBackendResponse(ok(true), context.requestId);
    }

    const format = payload.format;
    const title = payload.title;
    const rowCount = payload.rowCount;
    const from = payload.from;
    const to = payload.to;
    if (
      (format !== "csv" && format !== "pdf") ||
      typeof title !== "string" || title.trim().length < 1 || title.length > 100 ||
      !Number.isInteger(rowCount) || (rowCount as number) < 0 || (rowCount as number) > 100_000 ||
      (from !== undefined && (typeof from !== "string" || from.length > 40)) ||
      (to !== undefined && (typeof to !== "string" || to.length > 40))
    ) {
      return createBackendResponse(fail(validationError("Export audit details are invalid.")), context.requestId);
    }

    await new SupabaseAuditRepository().record({
      actor,
      action: "report.exported",
      entityType: "system",
      entityId: "admin_export",
      summary: `${format.toUpperCase()} export generated: ${title.trim()} (${rowCount} rows)`,
      severity: "info",
      after: {
        format,
        title: title.trim(),
        rowCount,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      },
    });

    return createBackendResponse(ok(true), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
