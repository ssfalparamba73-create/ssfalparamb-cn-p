"use client";

import { ExportActions } from "@/components/admin/exports/ExportActions";
import { getOutstandingDuesExport } from "@/lib/api/adminPaymentExportClient";
import type { ExportDateRange } from "@/components/admin/exports/ExportActions";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function duesMonthsInRange(range: ExportDateRange): string[] {
  if (range.mode === "all" || (!range.from && !range.to)) return [];
  if (!range.from || !range.to) throw new Error("Choose both the first and last dues months.");
  const start = new Date(range.from);
  const end = new Date(range.to);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  const months: string[] = [];
  while (cursor <= last && months.length < 24) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (cursor <= last) throw new Error("Choose a dues period of 24 months or less.");
  return months;
}

export function DefaultersExportButton() {
  return (
    <ExportActions
      filename="ssf-pending-payments"
      title="Pending payments"
      description="Members without confirmed coverage for the selected dues months. Current balance is shown separately."
      filterKind="dues-month"
      filtersInPreview
      initialDateMode="month"
      columnWidths={[12, 18, 12, 13, 23, 12, 10]}
      getData={async (range) => {
        const months = duesMonthsInRange(range);
        const members = await getOutstandingDuesExport(months[0], months.at(-1));
        const rows = members.map((member) => ({
          values: [member.memberCode, member.name, member.phone, member.area, member.unpaidMonths.join(", ") || "Current outstanding dues", String(member.currentBalance), member.lastPaidAt || ""],
        }));
        return {
          headers: ["Member Code", "Name", "Phone", "Area", "Unpaid Dues Month(s)", "Current Balance", "Last Paid"],
          rows,
        };
      }}
    />
  );
}
