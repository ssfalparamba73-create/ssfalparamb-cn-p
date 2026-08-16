"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAllAdminMembers } from "@/lib/api/memberClient";
import { downloadCsv } from "@/lib/client/downloadCsv";

export function DefaultersExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  async function exportDefaulters() {
    setIsExporting(true);
    try {
      const members = (await getAllAdminMembers()).filter((member) => member.duesPending > 0).sort((a, b) => b.duesPending - a.duesPending);
      downloadCsv("ssf-pending-payments.csv", [["Member Code", "Name", "Phone", "Area", "Monthly Amount", "Pending Amount", "Last Paid"], ...members.map((member) => [member.memberCode, member.name, member.phone, member.area || "", String(member.monthlyAmount), String(member.duesPending), member.lastPaidAt || ""]) ]);
      toast.success("Pending payments CSV downloaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export pending payments."); }
    finally { setIsExporting(false); }
  }
  return <Button variant="outline" onClick={exportDefaulters} disabled={isExporting} className="shrink-0"><Download className="mr-2 size-4" />{isExporting ? "Exporting…" : "Export CSV"}</Button>;
}
