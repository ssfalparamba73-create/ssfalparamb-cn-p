"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllAdminPayments } from "@/lib/api/adminPaymentExportClient";
import { downloadCsv } from "@/lib/client/downloadCsv";

export function DashboardExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  async function exportReport() {
    setIsExporting(true);
    try {
      const confirmed = (await getAllAdminPayments()).filter((payment) => payment.status === "confirmed" && !payment.voidedAt);
      downloadCsv("ssf-financial-report.csv", [["Receipt ID", "Payer", "Category", "Method", "Amount", "Date"], ...confirmed.map((payment) => [payment.receiptId, payment.payerName || payment.payerPhone, payment.category, payment.method, String(payment.amount), payment.paidAt || payment.recordedAt])]);
      toast.success("Financial report downloaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export report."); }
    finally { setIsExporting(false); }
  }
  return <Button variant="outline" onClick={exportReport} disabled={isExporting} className="hidden h-10 border-slate-200 font-medium text-slate-700 sm:flex"><FileText className="mr-2 h-4 w-4" />{isExporting ? "Exporting…" : "Export Report"}</Button>;
}
