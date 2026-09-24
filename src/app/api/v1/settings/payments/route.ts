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
  upiEnabled: true,
  specialEventEnabled: false,
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
      upiEnabled: data?.value?.upiEnabled ?? DEFAULTS.upiEnabled,
      specialEventEnabled: data?.value?.specialEventEnabled ?? DEFAULTS.specialEventEnabled,
    };

    const response = createBackendResponse(ok(publicSettings), context.requestId);
    // Cache heavily on Vercel Edge network to prevent database load
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}
