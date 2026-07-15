"use client";

import React from "react";
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
import { MOCK_PAYMENTS, MOCK_CASH_HANDOVERS } from "@/lib/admin/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminClient } from "@/lib/frontend-api/adminClient";
import { toast } from "sonner";
import { AdminDashboardStatsDTO } from "@/lib/backend/dto/admin.dto";
import { PaymentDTO } from "@/lib/backend/dto/payment.dto";

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<AdminDashboardStatsDTO | null>(null);
  const [payments, setPayments] = React.useState<PaymentDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const statsRes = await adminClient.getDashboard();
        setStats(statsRes);
        
        // Fetch recent payments
        const payRes = await adminClient.listPayments({ pageSize: "5" });
        setPayments(payRes.items || []);
      } catch (error: any) {
        toast.error(error.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-50">Dashboard</h2>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Overview of collections and community health.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-10 border-slate-200 text-slate-700 font-medium hidden sm:flex">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Banknote className="w-4 h-4 mr-2" />
            Record Cash
          </Button>
          <AdminActionIcon aria-label="Add Member" className="h-10 w-10 sm:hidden">
            <UserPlus className="w-4 h-4" />
          </AdminActionIcon>
          <Button variant="outline" className="h-10 border-slate-200 text-slate-700 font-medium hidden sm:flex">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
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
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          helper="Out of 168 active"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CollectionTrendChart data={stats.collectionTrend} />
            <PaymentMethodChart data={stats.paymentMethodSplit} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RecentPayments payments={payments as any} />
            <RecentCashHandovers />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
             <h3 className="text-base font-semibold text-slate-900 mb-4 dark:text-slate-50">Risk Summary</h3>
             <div className="space-y-4">
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
