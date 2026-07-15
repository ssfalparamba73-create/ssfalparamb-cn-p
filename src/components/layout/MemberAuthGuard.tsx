"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/SessionContext";

export function MemberAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!session || session.actorType !== "member")) {
      // If we are already on the login page, don't redirect (though login is at /login, not /member/login)
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [session, isLoading, pathname, router]);

  // Optionally show a loading state while checking session
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F6F8FC] dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If we have no session after loading, we render nothing to avoid flashing protected content before redirect takes effect.
  if (!session || session.actorType !== "member") {
    return null;
  }

  return <>{children}</>;
}
