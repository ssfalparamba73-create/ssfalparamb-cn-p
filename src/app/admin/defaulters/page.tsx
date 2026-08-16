import React from "react";
import { DefaultersManager } from "@/components/admin/defaulters/DefaultersManager";

import { DefaultersExportButton } from "@/components/admin/exports/DefaultersExportButton";

export const metadata = {
  title: "Pending Payments | SSF Alparamba Admin",
  description: "View and follow up with members who have pending dues.",
};

export default function DefaultersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Pending Payments</h2>
          <p className="text-slate-500 dark:text-slate-400">
            A polite overview of members who currently have pending dues, with options to send gentle reminders.
          </p>
        </div>
        <DefaultersExportButton />
      </div>

      <div className="mt-6">
        <DefaultersManager />
      </div>
    </div>
  );
}
