import type { NextRequest } from "next/server";
import { SupabaseAdminRepository } from "@/lib/backend/adapters/supabase/repositories/supabaseAdminRepository";
import { createSupabaseBackendClient } from "@/lib/backend/adapters/supabase/client";
import { resolveAuthenticatedActor } from "@/lib/backend/auth/resolveActor";
import { permissionError, serverError, validationError } from "@/lib/backend/errors/createBackendError";
import { fail, ok } from "@/lib/backend/errors/resultHelpers";
import { createBackendResponse } from "@/lib/backend/http/backendResultResponse";
import { buildPublicActorContext } from "@/lib/backend/http/requestContext";

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_MONTHS = 24;
const MAX_EXPORT_ROWS = 10_000;
const PAGE_SIZE = 1_000;

interface MemberRow {
  id: string;
  member_code: string;
  name: string;
  phone: string;
  area: string | null;
  dues_pending: number | string;
  joined_at: string | null;
  created_at: string;
  last_paid_at: string | null;
}

interface CoverageRow {
  member_id: string | null;
  payment_months: Array<{ month_key: string }>;
}

function monthDistance(from: string, to: string) {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  return (toYear - fromYear) * 12 + toMonth - fromMonth + 1;
}

function currentIndiaMonth() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

function indiaMonthKey(value: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

export async function GET(request: NextRequest) {
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

    const permissions = actor.permissions ?? await new SupabaseAdminRepository().getAdminPermissions(actor.adminId);
    if (!permissions.includes("reports.export")) {
      return createBackendResponse(fail(permissionError("Permission denied: requires reports.export")), context.requestId);
    }

    const params = request.nextUrl.searchParams;
    const fromMonth = params.get("fromMonth") || undefined;
    const toMonth = params.get("toMonth") || undefined;
    if ((fromMonth && !MONTH_KEY.test(fromMonth)) || (toMonth && !MONTH_KEY.test(toMonth))) {
      return createBackendResponse(fail(validationError("Choose valid dues months.")), context.requestId);
    }
    if (Boolean(fromMonth) !== Boolean(toMonth)) {
      return createBackendResponse(fail(validationError("Choose both the first and last dues months.")), context.requestId);
    }
    if (fromMonth && toMonth && fromMonth > toMonth) {
      return createBackendResponse(fail(validationError("First month must be on or before the last month.")), context.requestId);
    }
    if (fromMonth && toMonth && monthDistance(fromMonth, toMonth) > MAX_MONTHS) {
      return createBackendResponse(fail(validationError(`Dues exports are limited to ${MAX_MONTHS} months per request.`)), context.requestId);
    }
    if (toMonth && toMonth > currentIndiaMonth()) {
      return createBackendResponse(fail(validationError("Future dues months cannot be exported.")), context.requestId);
    }

    const supabase = createSupabaseBackendClient();
    const memberResult = await supabase
      .from("members")
      .select("id,member_code,name,phone,area,dues_pending,joined_at,created_at,last_paid_at", { count: "exact" })
      .eq("status", "active")
      .gt("dues_pending", 0)
      .order("name", { ascending: true })
      .range(0, MAX_EXPORT_ROWS);
    if (memberResult.error) throw memberResult.error;
    if ((memberResult.count ?? 0) > MAX_EXPORT_ROWS) {
      return createBackendResponse(
        fail(validationError(`This export has more than ${MAX_EXPORT_ROWS.toLocaleString("en-IN")} members. Narrow the period or filters and try again.`)),
        context.requestId,
      );
    }

    const members = (memberResult.data ?? []) as MemberRow[];
    const coveredMonthsByMember = new Map<string, Set<string>>();
    if (fromMonth && toMonth) {
      const snapshotAt = new Date().toISOString();
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error, count } = await supabase
          .from("payments")
          .select("member_id,payment_months!inner(month_key)", { count: "exact" })
          .eq("status", "confirmed")
          .eq("category", "monthly_dues")
          .is("voided_at", null)
          .lte("updated_at", snapshotAt)
          .gte("payment_months.month_key", fromMonth)
          .lte("payment_months.month_key", toMonth)
          .order("id", { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;

        const pageRows = (data ?? []) as CoverageRow[];
        for (const payment of pageRows) {
          if (!payment.member_id) continue;
          const covered = coveredMonthsByMember.get(payment.member_id) ?? new Set<string>();
          for (const month of payment.payment_months ?? []) covered.add(month.month_key);
          coveredMonthsByMember.set(payment.member_id, covered);
        }
        if (pageRows.length < PAGE_SIZE || offset + PAGE_SIZE >= (count ?? 0)) break;
      }
    }

    const selectedMonths = fromMonth && toMonth
      ? Array.from({ length: monthDistance(fromMonth, toMonth) }, (_, index) => {
        const [year, month] = fromMonth.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1 + index, 1));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      })
      : [];

    const items = members.flatMap((member) => {
      const joinedMonth = indiaMonthKey(member.joined_at ?? member.created_at);
      const eligibleMonths = selectedMonths.filter((month) => month >= joinedMonth);
      const unpaidMonths = eligibleMonths.filter((month) => !coveredMonthsByMember.get(member.id)?.has(month));
      if (selectedMonths.length > 0 && unpaidMonths.length === 0) return [];
      return [{
        memberCode: member.member_code,
        name: member.name,
        phone: member.phone,
        area: member.area ?? "",
        unpaidMonths,
        currentBalance: Number(member.dues_pending),
        lastPaidAt: member.last_paid_at,
      }];
    });

    return createBackendResponse(ok({ items, total: items.length, fromMonth, toMonth }), context.requestId);
  } catch {
    return createBackendResponse(fail(serverError("Unable to prepare the unpaid-dues export.")), context.requestId);
  }
}
