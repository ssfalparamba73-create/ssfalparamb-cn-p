"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllAdminPayments } from "@/lib/api/adminPaymentExportClient";
import { downloadCsv } from "@/lib/client/downloadCsv";

export function PaymentsExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  async function exportPayments() {
    setIsExporting(true);
    try {
      const payments = await getAllAdminPayments();
      downloadCsv("ssf-payments.csv", [["Receipt ID", "Payer", "Phone", "Category", "Method", "Amount", "Status", "Date"], ...payments.map((payment) => [payment.receiptId, payment.payerName || "", payment.payerPhone, payment.category, payment.method, String(payment.amount), payment.status, payment.paidAt || payment.recordedAt])]);
      toast.success("Payments CSV downloaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export payments."); }
    finally { setIsExporting(false); }
  }
  return <Button variant="outline" onClick={exportPayments} disabled={isExporting} className="shrink-0"><Download className="mr-2 size-4" />{isExporting ? "Exporting…" : "Export CSV"}</Button>;
}
