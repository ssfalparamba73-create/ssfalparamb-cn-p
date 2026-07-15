"use client";

import { useEffect, useState } from "react";
import { DueStatusCard } from "@/components/dashboard/DueStatusCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { memberClient } from "@/lib/frontend-api/memberClient";
import type { MemberDashboardDTO } from "@/lib/backend/dto/member.dto";
import { useSession } from "@/lib/auth/SessionContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MemberDashboardPage() {
  const { session } = useSession();
  const [data, setData] = useState<MemberDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await memberClient.getDashboard();
        setData(res);
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <div className="p-12 flex justify-center items-center"><Loader2 className="animate-spin text-slate-400 size-8" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col mb-2">
        <span className="text-sm text-slate-500 font-medium leading-none mb-1.5 dark:text-slate-400">Welcome back,</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none dark:text-slate-50">{session?.name || "Member"}</h1>
        <span className="text-xs text-slate-500 font-medium mt-2 dark:text-slate-400">Member Code: {data.member.memberCode}</span>
      </div>

      <DueStatusCard amountDue={data.dueSummary.pendingAmount} />
      <RecentActivityCard activities={data.recentActivity.map(a => ({
        id: a.id,
        date: new Date(a.createdAt).toLocaleDateString(),
        type: a.title,
        status: "completed"
      }))} />
    </div>
  );
}
