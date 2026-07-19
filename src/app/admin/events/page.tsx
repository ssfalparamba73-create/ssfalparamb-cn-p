import React from "react";
import { EventsConfigManager } from "@/components/admin/settings/EventsConfigManager";

export default function AdminEventsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-50">Special Events</h2>
        <p className="text-slate-500 mt-1 dark:text-slate-400">Create, edit, and manage active donation campaigns.</p>
      </div>
      <EventsConfigManager />
    </div>
  );
}
