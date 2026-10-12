"use client";

import { ExportActions } from "@/components/admin/exports/ExportActions";
import { getAllAdminPayments } from "@/lib/api/adminPaymentExportClient";

export function PaymentsExportButton() {
  return (
    <ExportActions
      filename="ssf-payments"
      title="Payments ledger"
      description="Confirmed payments only. Pending, failed, cancelled, rejected, and voided records are excluded."
      filtersInPreview
      columnWidths={[13, 17, 12, 13, 12, 12, 10, 11]}
      getData={async (range) => {
        const payments = await getAllAdminPayments(range);
        const confirmed = payments.filter((payment) => payment.status === "confirmed" && !payment.voidedAt);
        return {
          headers: ["Receipt ID", "Payer", "Phone", "Category", "Method", "Amount", "Status", "Date"],
          rows: confirmed.map((payment) => ({
            values: [payment.receiptId, payment.payerName || "", payment.payerPhone, payment.category, payment.method, String(payment.amount), payment.status, payment.paidAt || payment.recordedAt],
            date: payment.paidAt || payment.recordedAt,
          })),
        };
      }}
    />
  );
}
