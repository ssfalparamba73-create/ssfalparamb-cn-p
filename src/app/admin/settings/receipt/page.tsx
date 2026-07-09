import React from "react";
import { ReceiptBuilder } from "@/components/admin/settings/receipt/ReceiptBuilder";

export const metadata = {
  title: "Receipt Settings | SSF Alparamba Admin",
  description: "Customize the design and layout of the payment receipt.",
};

export default function ReceiptSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Receipt Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Customize the background image and layout of the payment receipt.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ReceiptBuilder />
      </div>
    </div>
  );
}
