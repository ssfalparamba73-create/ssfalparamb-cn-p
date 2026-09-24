import type { NextRequest } from "next/server";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

const DEFAULTS = {
  baseTier: 50,
  premiumTier: 100,
  customMinimum: 10,
};

export async function GET(request: NextRequest) {
  const context = buildPublicActorContext(request);
  try {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("namespace", "payments")
      .eq("key", "config")
      .maybeSingle();

    if (error) throw error;
    
    // We only expose public, non-sensitive data
    const publicSettings = {
      baseTier: data?.value?.baseTier ?? DEFAULTS.baseTier,
      premiumTier: data?.value?.premiumTier ?? DEFAULTS.premiumTier,
      customMinimum: data?.value?.customMinimum ?? DEFAULTS.customMinimum,
    };

    return createBackendResponse(ok(publicSettings), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
