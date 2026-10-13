"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DueStatusCard } from "@/components/dashboard/DueStatusCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { MemberDashboardQuickActions } from "@/components/member/MemberDashboardQuickActions";
import { MemberWelcomeBanner } from "@/components/member/MemberWelcomeBanner";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { memberDashboardQuery } from "@/lib/client/memberQueries";

export default function MemberDashboardPage() {
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const { data: dashboard, error } = useQuery(memberDashboardQuery);

  if (!dashboard) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p> : <PageContentSkeleton />}
      </div>
    );
  }

  const dueStatus = (
    <DueStatusCard amountDue={dashboard.dueSummary.pendingAmount} paymentStatus={dashboard.dueSummary.paymentStatus} />
  );

  return (
    <>
      <div className="space-y-4 p-4 pb-6 animate-in fade-in duration-300 md:hidden">
        <header className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Welcome back,</p>
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{dashboard.member.name}</h1>
          </div>
          <span className="shrink-0 rounded-full border border-[#D9E2EC] bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {dashboard.member.memberCode}
          </span>
        </header>

        {isBannerVisible && <MemberWelcomeBanner compact onDismiss={() => setIsBannerVisible(false)} />}
        {dueStatus}
        <MemberDashboardQuickActions compact />
        <RecentActivityCard activities={dashboard.recentActivity} />
      </div>

      <div className="hidden space-y-6 p-6 pb-8 animate-in fade-in duration-300 md:block lg:p-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back,</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{dashboard.member.name}</h1>
          </div>
          <span className="rounded-full border border-[#D9E2EC] bg-white px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Member ID · {dashboard.member.memberCode}
          </span>
        </header>

        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] items-center gap-6">
          {isBannerVisible && <MemberWelcomeBanner onDismiss={() => setIsBannerVisible(false)} />}
          {dueStatus}
        </div>
        <MemberDashboardQuickActions />
        <RecentActivityCard activities={dashboard.recentActivity} />
      </div>
    </>
  );
}
