import React from "react";
import { PaymentsTable } from "@/components/admin/payments/PaymentsTable";
import { Button } from "@/components/ui/button";
import { PaymentsExportButton } from "@/components/admin/exports/PaymentsExportButton";

export const metadata = {
  title: "Payments Ledger | SSF Alparamba Admin",
  description: "View and manage all financial transactions",
};

export default function PaymentsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Payments Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400">
            A unified view of all money movement across dues, events, and cash.
          </p>
        </div>
        
        <PaymentsExportButton />
      </div>

      <div className="mt-6">
        <PaymentsTable />
      </div>
    </div>
  );
}
