import { infiniteQueryOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { getCurrentSession } from "@/lib/api/authClient";
import { getMemberDashboard } from "@/lib/api/dashboardClient";
import { getCurrentMemberProfile, getMemberDirectory } from "@/lib/api/memberClient";
import { getMemberPayments } from "@/lib/api/paymentClient";
import { getPublicBlockOptions } from "@/lib/api/settingsClient";
import { getSupportContacts } from "@/lib/api/supportClient";
import type { BloodGroup } from "@/lib/backend/dto/member.dto";

const MINUTE = 60_000;

export const memberQueryKeys = {
  session: ["auth", "session"] as const,
  dashboard: ["member", "dashboard"] as const,
  profile: ["member", "profile"] as const,
  payments: ["member", "payments"] as const,
  directory: (search: string, bloodGroup?: BloodGroup) =>
    ["member", "directory-v2", { search, bloodGroup: bloodGroup ?? null }] as const,
  supportContacts: ["member", "support-contacts"] as const,
  blockOptions: ["member", "block-options"] as const,
};

export const memberSessionQuery = queryOptions({
  queryKey: memberQueryKeys.session,
  queryFn: getCurrentSession,
  staleTime: 10 * MINUTE,
});

export const memberDashboardQuery = queryOptions({
  queryKey: memberQueryKeys.dashboard,
  queryFn: getMemberDashboard,
  staleTime: 2 * MINUTE,
});

export const memberProfileQuery = queryOptions({
  queryKey: memberQueryKeys.profile,
  queryFn: getCurrentMemberProfile,
  staleTime: 10 * MINUTE,
});

export const memberPaymentsQuery = queryOptions({
  queryKey: memberQueryKeys.payments,
  queryFn: getMemberPayments,
  staleTime: MINUTE,
});

export const memberSupportContactsQuery = queryOptions({
  queryKey: memberQueryKeys.supportContacts,
  queryFn: getSupportContacts,
  staleTime: 12 * 60 * MINUTE,
});

export const memberBlockOptionsQuery = queryOptions({
  queryKey: memberQueryKeys.blockOptions,
  queryFn: getPublicBlockOptions,
  staleTime: 24 * 60 * MINUTE,
});

export function memberDirectoryQuery(search: string, bloodGroup?: BloodGroup) {
  const normalizedSearch = search.trim();
  return infiniteQueryOptions({
    queryKey: memberQueryKeys.directory(normalizedSearch, bloodGroup),
    queryFn: ({ signal, pageParam }) =>
      getMemberDirectory(
        {
          search: normalizedSearch || undefined,
          bloodGroup,
          donorAvailable: bloodGroup ? true : undefined,
        },
        signal,
        pageParam,
        30
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 10 * MINUTE,
  });
}

export function prefetchMemberRoute(queryClient: QueryClient, href: string): void {
  if (href.startsWith("/member/dashboard")) {
    void queryClient.prefetchQuery(memberDashboardQuery);
  } else if (href.startsWith("/member/payments")) {
    void queryClient.prefetchQuery(memberPaymentsQuery);
  } else if (href.startsWith("/member/directory")) {
    void queryClient.prefetchInfiniteQuery(memberDirectoryQuery(""));
  } else if (href.startsWith("/member/profile")) {
    void Promise.all([
      queryClient.prefetchQuery(memberProfileQuery),
      queryClient.prefetchQuery(memberSupportContactsQuery),
      queryClient.prefetchQuery(memberBlockOptionsQuery),
    ]);
  }
}
