"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  memberDashboardQuery,
  memberDirectoryQuery,
  memberPaymentsQuery,
  memberProfileQuery,
} from "@/lib/client/memberQueries";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

export function MemberDataWarmup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const warmup = () => {
      void queryClient.prefetchQuery(memberDashboardQuery);
      void queryClient.prefetchQuery(memberProfileQuery);
      void queryClient.prefetchInfiniteQuery(memberDirectoryQuery(""));
      if (MEMBER_PAYMENTS_ENABLED) {
        void queryClient.prefetchQuery(memberPaymentsQuery);
      }
    };

    const idleApi = window as unknown as {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleApi.requestIdleCallback) {
      const idleId = idleApi.requestIdleCallback(warmup, { timeout: 2_000 });
      return () => idleApi.cancelIdleCallback?.(idleId);
    }

    const timer = globalThis.setTimeout(warmup, 1_000);
    return () => globalThis.clearTimeout(timer);
  }, [queryClient]);

  return null;
}
