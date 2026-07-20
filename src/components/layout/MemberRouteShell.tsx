"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/api/authClient";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { MemberBottomNav } from "@/components/layout/MemberBottomNav";

const PROFILE_COMPLETION_PATH = "/member/complete-profile";

export function MemberRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowedPath, setAllowedPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then((session) => {
        if (!active) return;
        if (session.actorType !== "member") {
          router.replace("/login");
          return;
        }
        const isCompletionPage = pathname === PROFILE_COMPLETION_PATH;
        if (!session.profileComplete && !isCompletionPage) {
          router.replace(PROFILE_COMPLETION_PATH);
          return;
        }
        if (session.profileComplete && isCompletionPage) {
          router.replace("/member/dashboard");
          return;
        }
        setAllowedPath(pathname);
      })
      .catch(() => router.replace("/login"));

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (allowedPath !== pathname) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center px-4 font-sans dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  if (pathname === PROFILE_COMPLETION_PATH) {
    return <div className="min-h-screen bg-[#F6F8FC] font-sans dark:bg-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col font-sans transition-colors duration-300 dark:bg-slate-900">
      <MemberHeader />
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl pb-24 md:pb-8 transition-colors duration-300">
        {children}
      </main>
      <MemberBottomNav />
    </div>
  );
}
