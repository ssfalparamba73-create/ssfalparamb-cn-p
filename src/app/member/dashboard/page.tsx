"use client";

import { useQuery } from "@tanstack/react-query";
import { DueStatusCard } from "@/components/dashboard/DueStatusCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { memberDashboardQuery } from "@/lib/client/memberQueries";

export default function MemberDashboardPage() {
  const { data: dashboard, error } = useQuery(memberDashboardQuery);

  if (!dashboard) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p> : <PageContentSkeleton />}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col mb-2">
        <span className="text-sm text-slate-500 font-medium leading-none mb-1.5 dark:text-slate-400">Welcome back,</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none dark:text-slate-50">{dashboard.member.name}</h1>
      </div>

      <DueStatusCard amountDue={dashboard.dueSummary.pendingAmount} paymentStatus={dashboard.dueSummary.paymentStatus} />
      <RecentActivityCard activities={dashboard.recentActivity} />
    </div>
  );
}
