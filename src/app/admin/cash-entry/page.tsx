import React from "react";
import { CashEntryForm } from "@/components/admin/cash-entry/CashEntryForm";

export const metadata = {
  title: "Cash Entry | SSF Alparamba Admin",
  description: "Record manual cash payments",
};

export default function CashEntryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Manual Cash Entry</h2>
      </div>

      <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
        Record cash payments received directly from members. These will be logged as &apos;Cash Handover&apos; in the system.
      </p>

      <div className="mt-6">
        <CashEntryForm />
      </div>
    </div>
  );
}
