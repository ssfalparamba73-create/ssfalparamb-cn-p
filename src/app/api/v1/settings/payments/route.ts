import type { NextRequest } from "next/server";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { serverError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";
import { isDuesFrequency } from "@/lib/payments/duesPeriod";

const DEFAULTS = {
  baseTier: 50,
  premiumTier: 100,
  customMinimum: 10,
  duesFrequency: "monthly" as const,
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
      duesFrequency: isDuesFrequency(data?.value?.duesFrequency)
        ? data.value.duesFrequency
        : DEFAULTS.duesFrequency,
      upiEnabled: data?.value?.upiEnabled ?? DEFAULTS.upiEnabled,
      specialEventEnabled: data?.value?.specialEventEnabled ?? DEFAULTS.specialEventEnabled,
    };

    const response = createBackendResponse(ok(publicSettings), context.requestId);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch {
    const response = createBackendResponse(fail(serverError()), context.requestId);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
