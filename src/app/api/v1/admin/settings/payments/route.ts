import type { NextRequest } from "next/server";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { permissionError, serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

const DEFAULTS = {
  upiId: "ssfalparamba@okaxis",
  merchantName: "Atiyya Group",
  qrCodeUrl: "",
  duesFrequency: "monthly",
  baseTier: 50,
  premiumTier: 100,
  customMinimum: 10,
  receiptPrefix: "REC",
  includeYear: true,
  upiEnabled: true,
  specialEventEnabled: false,
};

const DUES_FREQUENCIES = new Set(["monthly", "bimonthly", "quarterly"]);
const MAX_INR_AMOUNT = 99_999_999.99;

function isValidConfiguredAmount(value: number): boolean {
  const minorAmount = Math.round(value * 100);
  return Number.isFinite(value)
    && value > 0
    && value <= MAX_INR_AMOUNT
    && Number.isSafeInteger(minorAmount)
    && Math.abs(value * 100 - minorAmount) <= 1e-7;
}

async function getAdmin(request: NextRequest) {
  const context = buildPublicActorContext(request);
  const actorResult = await resolveAuthenticatedActor(request, context.requestId);
  return { context, actorResult };
}

export async function GET(request: NextRequest) {
  const { context, actorResult } = await getAdmin(request);
  if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
  if (actorResult.data!.actorType !== "admin") return createBackendResponse(fail(validationError("Admin access required.")), context.requestId);
  if (!actorResult.data!.permissions?.some((permission) => ["settings.view", "settings.update"].includes(permission))) {
    return createBackendResponse(fail(permissionError("You do not have permission to view payment settings.")), context.requestId);
  }
  try {
    const supabase = createSupabaseBackendClient();
    const { data, error } = await supabase.from("app_settings").select("value").eq("namespace", "payments").eq("key", "config").maybeSingle();
    if (error) throw error;
    return createBackendResponse(ok({ ...DEFAULTS, ...(data?.value as Partial<typeof DEFAULTS> | null) }), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError()), context.requestId);
  }
}

export async function PATCH(request: NextRequest) {
  const { context, actorResult } = await getAdmin(request);
  if (!actorResult.ok) return createBackendResponse(actorResult, context.requestId);
  if (actorResult.data!.actorType !== "admin") return createBackendResponse(fail(validationError("Admin access required.")), context.requestId);
  if (!actorResult.data!.permissions?.includes("settings.update")) {
    return createBackendResponse(fail(permissionError("You do not have permission to update payment settings.")), context.requestId);
  }
  try {
    const body = await request.json();
    const settings = {
      upiId: String(body.upiId || "").trim(),
      merchantName: String(body.merchantName || "").trim(),
      qrCodeUrl: String(body.qrCodeUrl || "").trim(),
      duesFrequency: String(body.duesFrequency || "monthly"),
      baseTier: Number(body.baseTier),
      premiumTier: Number(body.premiumTier),
      customMinimum: Number(body.customMinimum),
      receiptPrefix: String(body.receiptPrefix || "REC").trim().toUpperCase(),
      includeYear: Boolean(body.includeYear),
      upiEnabled: body.upiEnabled === undefined ? true : Boolean(body.upiEnabled),
      specialEventEnabled: Boolean(body.specialEventEnabled),
    };
    if (!DUES_FREQUENCIES.has(settings.duesFrequency)) {
      return createBackendResponse(fail(validationError("Invalid subscriptions frequency.", "duesFrequency")), context.requestId);
    }
    if (!settings.upiId || !settings.merchantName || !settings.receiptPrefix || [settings.baseTier, settings.premiumTier, settings.customMinimum].some((value) => !isValidConfiguredAmount(value))) {
      return createBackendResponse(fail(validationError("Please provide valid payment settings.")), context.requestId);
    }
    const supabase = createSupabaseBackendClient();
    const { error } = await supabase.from("app_settings").upsert({ namespace: "payments", key: "config", value: settings, updated_at: new Date().toISOString() }, { onConflict: "namespace,key" });
    if (error) throw error;
    return createBackendResponse(ok(settings), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError("Unable to save payment settings.")), context.requestId);
  }
}

