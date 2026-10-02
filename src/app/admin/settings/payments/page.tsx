import React from "react";
import { PaymentConfigManager } from "@/components/admin/settings/PaymentConfigManager";

export const metadata = {
  title: "Payment Configuration | SSF Alparamba Admin",
  description: "Configure Razorpay availability, contribution frequency, and payment amounts.",
};

export default function PaymentSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Payment Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Configure online checkout, contribution periods, amounts, and receipt numbering.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <PaymentConfigManager />
      </div>
    </div>
  );
}

