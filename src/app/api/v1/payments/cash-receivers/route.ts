import { NextRequest } from "next/server";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { serverError } from "@/lib/backend/errors/createBackendError";

export async function GET(request: NextRequest) {
  const actor = buildPublicActorContext(request);

  try {
    const supabase = createSupabaseBackendClient();
    const { data: permissions, error: permissionError } = await supabase
      .from("admin_permissions")
      .select("admin_id")
      .eq("permission_code", "payments.record_cash");
    if (permissionError) throw permissionError;
    const receiverIds = [...new Set((permissions ?? []).map((permission) => permission.admin_id))];
    if (receiverIds.length === 0) {
      return createBackendResponse(ok([]), actor.requestId);
    }
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, name")
      .eq("status", "active")
      .in("id", receiverIds)
      .order("name");

    if (error) throw error;

    return createBackendResponse(
      ok((data ?? []).map((admin) => ({ id: admin.id, name: admin.name }))),
      actor.requestId
    );
  } catch {
    return createBackendResponse(fail(serverError("Unable to load cash receivers.")), actor.requestId);
  }
}
