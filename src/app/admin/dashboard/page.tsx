"use client";

import React, { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Banknote,
  AlertOctagon,
  TrendingUp,
  CreditCard,
  Droplet,
  UserPlus,
  FileText
} from "lucide-react";
import { StatsCard } from "@/components/admin/dashboard/StatsCard";
import { RecentPayments } from "@/components/admin/dashboard/RecentPayments";
import { RecentCashHandovers } from "@/components/admin/dashboard/RecentCashHandovers";
import { AdminActionIcon } from "@/components/admin/layout/AdminActionIcon";
import { CollectionTrendChart } from "@/components/admin/dashboard/CollectionTrendChart";
import { PaymentMethodChart } from "@/components/admin/dashboard/PaymentMethodChart";
import type { AdminDashboardDTO } from "@/lib/backend/dto/dashboard.dto";
import { getAdminDashboard } from "@/lib/api/dashboardClient";
import { BackendApiError } from "@/lib/api/backendClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { useCachedQuery } from "@/lib/client/useCachedQuery";

export default function AdminDashboardPage() {
  const router = useRouter();
  const loadDashboard = useCallback(() => getAdminDashboard(), []);
  const {
    data: dashboard,
    error,
    isInitialLoading,
    isRefreshing,
    refetch,
  } = useCachedQuery<AdminDashboardDTO>({
    key: "admin:dashboard",
    queryFn: loadDashboard,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (error instanceof BackendApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [error, router]);

  if (!dashboard) {
    return (
      <div className="animate-in space-y-4 pb-6 fade-in duration-300">
        {error && !isInitialLoading ? (
          <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <span>{error instanceof Error ? error.message : "Unable to load dashboard."}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : <PageContentSkeleton />}
      </div>
    );
  }

  const stats = dashboard.stats;

  return (
    <div className="animate-in space-y-4 pb-6 fade-in duration-300">
      {isRefreshing && (
        <p role="status" className="text-xs text-slate-500 dark:text-slate-400">Updating dashboard...</p>
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-50">Dashboard</h2>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Overview of collections and community health.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 border-slate-200 text-slate-700 font-medium hidden sm:flex">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Banknote className="w-4 h-4 mr-2" />
            Record Cash
          </Button>
          <AdminActionIcon aria-label="Add Member" className="h-10 w-10 sm:hidden" onClick={() => router.push("/admin/members/new")}>
            <UserPlus className="w-4 h-4" />
          </AdminActionIcon>
          <Button asChild variant="outline" className="hidden h-10 border-slate-200 font-medium text-slate-700 sm:flex">
            <Link href="/admin/members/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Glass Buttons Grid (Only visible on small screens) */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {/* Button 1: Total Collected */}
        <Link href="/admin/payments" className="relative group overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all active:scale-95">
           <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 flex items-center justify-center mb-3">
             <TrendingUp className="w-6 h-6" />
           </div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight">
             ₹{stats.totalCollected.toLocaleString("en-IN")}
           </h3>
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Total Collected</p>
        </Link>

        {/* Button 2: Pending Amount */}
        <Link href="/admin/defaulters" className="relative group overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all active:scale-95">
           <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300 flex items-center justify-center mb-3">
             <AlertOctagon className="w-6 h-6" />
           </div>
           <h3 className="text-lg font-bold text-red-600 dark:text-red-400 font-mono tracking-tight">
             ₹{stats.pendingAmount.toLocaleString("en-IN")}
           </h3>
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Pending Amount</p>
        </Link>

        {/* Button 3: Paid Members */}
        <Link href="/admin/members" className="relative group overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all active:scale-95">
           <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 flex items-center justify-center mb-3">
             <Users className="w-6 h-6" />
           </div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight">
             {stats.paidMembers}
           </h3>
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Paid Members</p>
        </Link>

        {/* Button 4: Cash Handovers */}
        <Link href="/admin/cash-entry" className="relative group overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-all active:scale-95">
           <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300 flex items-center justify-center mb-3">
             <Banknote className="w-6 h-6" />
           </div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight">
             {stats.pendingCashHandovers}
           </h3>
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Cash Handovers</p>
        </Link>
      </div>

      {/* Main Stats Grid (Desktop Only) */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Collected"
          metric={`₹${stats.totalCollected.toLocaleString("en-IN")}`}
          helper="This month"
          icon={TrendingUp}
          variant="success"
          href="/admin/payments"
        />
        <StatsCard
          label="Pending Amount"
          metric={`₹${stats.pendingAmount.toLocaleString("en-IN")}`}
          helper="Across all active members"
          icon={AlertOctagon}
          variant="destructive"
          href="/admin/defaulters"
        />
        <StatsCard
          label="Paid Members"
          metric={stats.paidMembers}
          helper={`Out of ${stats.activeMembers} active`}
          icon={Users}
          href="/admin/members"
        />
        <StatsCard
          label="Cash Handovers"
          metric={stats.pendingCashHandovers}
          helper="Pending verification"
          icon={Banknote}
          variant="warning"
          href="/admin/cash-entry"
        />
      </div>

      {/* Secondary Stats & Content Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Left Column (Wider on Desktop) */}
        <div className="space-y-3 lg:col-span-2">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CollectionTrendChart data={stats.collectionTrend.map((item) => ({ month: item.label, amount: item.amount }))} />
            <PaymentMethodChart data={stats.paymentMethodSplit.map((item) => ({ ...item, color: item.color ?? "bg-blue-500" }))} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <RecentPayments payments={dashboard.recentPayments} />
            <RecentCashHandovers handovers={dashboard.recentCashHandovers} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
             <StatsCard
              label="Monthly Dues"
              metric={`₹${stats.monthlyDues.toLocaleString("en-IN")}`}
              icon={CreditCard}
            />
            <StatsCard
              label="Special Events"
              metric={`₹${stats.specialEvents.toLocaleString("en-IN")}`}
              icon={Banknote}
            />
          </div>
        </div>

        {/* Right Column (Sidebar-like on Desktop) */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
             <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">Risk Summary</h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Severe Defaulters</span>
                  <span className="text-sm font-bold text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded-md dark:bg-red-500/10 dark:text-red-300">
                    {stats.defaulters}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-700">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <Link href="/admin/defaulters" className="block w-full mt-2">
                  <Button variant="outline" className="w-full text-sm">
                    View Follow-up List
                  </Button>
                </Link>
             </div>
          </div>

          <div>
              <StatsCard
                label="Available Blood Donors"
                metric={stats.availableDonors}
                helper="Ready for emergency"
                icon={Droplet}
                variant="destructive"
                href="/admin/blood-donors"
              />
          </div>
        </div>
      </div>
    </div>
  );
}
