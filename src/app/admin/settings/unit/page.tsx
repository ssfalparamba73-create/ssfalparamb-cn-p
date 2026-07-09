import React from "react";
import { UnitSettingsManager } from "@/components/admin/settings/UnitSettingsManager";

export const metadata = {
  title: "Unit Settings | SSF Alparamba Admin",
  description: "Configure the official name, branch, and logo for your unit.",
};

export default function UnitSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Unit Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Update the unit name, official logo, branch details, and contact address.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <UnitSettingsManager />
      </div>
    </div>
  );
}
