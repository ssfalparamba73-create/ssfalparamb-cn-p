"use client";

import { ExportActions } from "@/components/admin/exports/ExportActions";
import { getAllAdminPayments } from "@/lib/api/adminPaymentExportClient";

export function DashboardExportButton() {
  return (
    <ExportActions
      filename="ssf-financial-report"
      title="Financial report"
      description="Confirmed payments, excluding voided records."
      className="col-span-2 w-full sm:col-span-1 sm:w-auto"
      filtersInPreview
      columnWidths={[15, 23, 14, 14, 11, 23]}
      getData={async (range) => {
        const confirmed = (await getAllAdminPayments(range)).filter((payment) => payment.status === "confirmed" && !payment.voidedAt);
        return {
          headers: ["Receipt ID", "Payer", "Category", "Method", "Amount", "Date"],
          rows: confirmed.map((payment) => ({
            values: [payment.receiptId, payment.payerName || payment.payerPhone, payment.category, payment.method, String(payment.amount), payment.paidAt || payment.recordedAt],
            date: payment.paidAt || payment.recordedAt,
          })),
        };
      }}
    />
  );
}
