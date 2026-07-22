"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMemberFilters } from "@/components/admin/members/AdminMemberFilters";
import { AdminMemberRow } from "@/components/admin/members/AdminMemberRow";
import { AdminMemberCard } from "@/components/admin/members/AdminMemberCard";
import type { Member } from "@/lib/admin/admin-types";
import { mapMemberDto } from "@/lib/admin/mapMemberDto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getAdminMembers } from "@/lib/api/memberClient";
import type { BloodGroup, MemberStatus, MonthlyTier } from "@/lib/backend/dto/member.dto";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const PAGE_SIZE = 20;

function MemberTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
          <td className="py-4 pl-4 pr-3 sm:pl-6"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></td>
          <td className="px-3 py-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-28" /></div></td>
          <td className="px-3 py-4"><Skeleton className="h-7 w-14 rounded-full" /></td>
          <td className="px-3 py-4"><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-12" /></div></td>
          <td className="px-3 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
          <td className="py-4 pr-4 pl-3 sm:pr-6"><Skeleton className="ml-auto h-8 w-20" /></td>
        </tr>
      ))}
    </>
  );
}

function MemberCardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
        </div>
      ))}
    </>
  );
}

export default function AdminMembersPage() {
  const router = useRouter();
  const hasLoadedMembers = useRef(false);
  const lastDebouncedSearch = useRef("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");

  // New Filters
  const [areaFilter, setAreaFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [arrearsFilter, setArrearsFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchQuery.trim();
      if (lastDebouncedSearch.current === nextSearch) return;
      lastDebouncedSearch.current = nextSearch;
      if (hasLoadedMembers.current) setIsRefreshing(true);
      setLoadError(null);
      setDebouncedSearch(nextSearch);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    getAdminMembers({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter as MemberStatus,
      bloodGroup: bloodGroupFilter === "all" ? undefined : bloodGroupFilter as BloodGroup,
      area: areaFilter === "all" ? undefined : areaFilter,
      monthlyTier: tierFilter === "all" ? undefined : tierFilter as MonthlyTier,
      paymentStatus: arrearsFilter === "all" ? undefined : arrearsFilter as "clear" | "arrears",
      sort: sortOption as "newest" | "name-asc" | "name-desc" | "dues-desc",
    }, 100, undefined, controller.signal)
      .then((result) => {
        setMembers(result.items.map(mapMemberDto));
        setTotal(result.total ?? 0);
        setHasMore(result.hasMore);
        hasLoadedMembers.current = true;
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (requestError instanceof BackendApiError && requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setLoadError(requestError instanceof Error ? requestError.message : "Unable to load members.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [areaFilter, arrearsFilter, bloodGroupFilter, debouncedSearch, page, retryKey, router, sortOption, statusFilter, tierFilter]);

  function resetPageAnd(setter: (value: string) => void) {
    return (value: string) => {
      if (hasLoadedMembers.current) setIsRefreshing(true);
      setLoadError(null);
      setter(value);
      setPage(1);
    };
  }

  function changePage(nextPage: number) {
    setIsRefreshing(true);
    setLoadError(null);
    setPage(nextPage);
  }

  function retryLoad() {
    if (hasLoadedMembers.current) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);
    setRetryKey((value) => value + 1);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-50">Members</h2>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Manage directory, profiles, and dues.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/members/new" className="w-full sm:w-auto">
            <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <AdminMemberFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={resetPageAnd(setStatusFilter)}
          bloodGroupFilter={bloodGroupFilter}
          setBloodGroupFilter={resetPageAnd(setBloodGroupFilter)}
          areaFilter={areaFilter}
          setAreaFilter={resetPageAnd(setAreaFilter)}
          tierFilter={tierFilter}
          setTierFilter={resetPageAnd(setTierFilter)}
          arrearsFilter={arrearsFilter}
          setArrearsFilter={resetPageAnd(setArrearsFilter)}
          sortOption={sortOption}
          setSortOption={resetPageAnd(setSortOption)}
        />
      </div>

      <div className="mt-4">
        {loadError && (
          <div className="mb-4 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={retryLoad}>Retry</Button>
          </div>
        )}
        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sm:pl-6">Member</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blood</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dues</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {isLoading ? <MemberTableSkeleton /> : members.map((member) => <AdminMemberRow key={member.id} member={member} />)}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3">
          {isLoading ? <MemberCardSkeleton /> : members.map((member) => <AdminMemberCard key={member.id} member={member} />)}
        </div>

        {!isLoading && !loadError && members.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No members found.</p>
        )}

        {!isLoading && total > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRefreshing ? "Updating..." : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1 || isRefreshing} onClick={() => changePage(Math.max(1, page - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!hasMore || isRefreshing} onClick={() => changePage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
