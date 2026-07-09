import React from "react";
import { SecuritySettingsManager } from "@/components/admin/settings/SecuritySettingsManager";

export const metadata = {
  title: "Security Settings | SSF Alparamba Admin",
  description: "Configure member login PIN lengths, expiry, and authentication rules.",
};

export default function SecuritySettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Security & PIN Rules</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Configure authentication rules, PIN policies, and biometric login settings.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <SecuritySettingsManager />
      </div>
    </div>
  );
}
