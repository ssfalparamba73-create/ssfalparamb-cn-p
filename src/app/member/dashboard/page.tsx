"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DueStatusCard } from "@/components/dashboard/DueStatusCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { BackendApiError } from "@/lib/api/backendClient";
import { getMemberDashboard } from "@/lib/api/dashboardClient";
import type { MemberDashboardViewDTO } from "@/lib/backend/dto/dashboard.dto";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";

export default function MemberDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<MemberDashboardViewDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMemberDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof BackendApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load dashboard.");
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!dashboard) {
    return (
      <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : <PageContentSkeleton />}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col mb-2">
        <span className="text-sm text-slate-500 font-medium leading-none mb-1.5 dark:text-slate-400">Welcome back,</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none dark:text-slate-50">{dashboard.member.name}</h1>
      </div>

      <DueStatusCard amountDue={dashboard.dueSummary.pendingAmount} />
      <RecentActivityCard activities={dashboard.recentActivity} />
    </div>
  );
}
