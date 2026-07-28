import React from "react";
import { MemberInvitationSettingsManager } from "@/components/admin/settings/MemberInvitationSettingsManager";

export const metadata = {
  title: "WhatsApp Invitation | SSF Alparamba Admin",
  description: "Edit and preview the default member invitation message.",
};

export default function MemberInvitationSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          WhatsApp Invitation
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Edit the default member invitation and verify its WhatsApp alignment before saving.
        </p>
      </div>
      <div className="mt-6">
        <MemberInvitationSettingsManager />
      </div>
    </div>
  );
}
