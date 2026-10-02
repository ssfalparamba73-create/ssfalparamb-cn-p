"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { MemberBottomNav } from "@/components/layout/MemberBottomNav";
import { memberSessionQuery } from "@/lib/client/memberQueries";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { MemberDataWarmup } from "@/components/member/MemberDataWarmup";
import { getCurrentSession } from "@/lib/api/authClient";
import { SESSION_REFRESH_INTERVAL_MS } from "@/lib/backend/auth/sessionConstants";

const PROFILE_COMPLETION_PATH = "/member/complete-profile";
const MAX_BROWSER_TIMEOUT_MS = 2_147_000_000;

export function MemberRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, isError } = useQuery(memberSessionQuery);

  useEffect(() => {
    let active = true;
    let lastRefreshAt = Date.now();
    const refreshSession = () => {
      if (Date.now() - lastRefreshAt < SESSION_REFRESH_INTERVAL_MS) return;
      lastRefreshAt = Date.now();
      void getCurrentSession().catch(() => {
        // Protected API requests remain the authority for session validity.
        // A transient heartbeat failure should not redirect a signed-in member.
      });
    };
    const onFocus = () => {
      if (active) refreshSession();
    };

    let refreshTimer = 0;
    const scheduleSessionRefresh = () => {
      const elapsed = Date.now() - lastRefreshAt;
      const remaining = Math.max(SESSION_REFRESH_INTERVAL_MS - elapsed, 0);
      refreshTimer = window.setTimeout(() => {
        refreshSession();
        scheduleSessionRefresh();
      }, Math.min(remaining, MAX_BROWSER_TIMEOUT_MS));
    };

    scheduleSessionRefresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (isError) {
      router.replace("/login");
      return;
    }
    if (!session) return;
    if (session.actorType !== "member") {
      router.replace("/login");
      return;
    }
    const isCompletionPage = pathname === PROFILE_COMPLETION_PATH;
    if (!session.profileComplete && !isCompletionPage) {
      router.replace(PROFILE_COMPLETION_PATH);
    } else if (session.profileComplete && isCompletionPage) {
      router.replace("/member/dashboard");
    }
  }, [isError, pathname, router, session]);

  const isCompletionPage = pathname === PROFILE_COMPLETION_PATH;
  const isAllowed = session?.actorType === "member" &&
    ((session.profileComplete && !isCompletionPage) || (!session.profileComplete && isCompletionPage));

  if (isPending || !isAllowed) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] px-4 py-6 font-sans dark:bg-slate-900">
        <PageContentSkeleton />
      </div>
    );
  }

  if (isCompletionPage) {
    return <div className="min-h-screen bg-[#F6F8FC] font-sans dark:bg-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col font-sans transition-colors duration-300 dark:bg-slate-900">
      <MemberHeader />
      <MemberDataWarmup />
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl pb-24 md:pb-8 transition-colors duration-300">
        {children}
      </main>
      <MemberBottomNav />
    </div>
  );
}
