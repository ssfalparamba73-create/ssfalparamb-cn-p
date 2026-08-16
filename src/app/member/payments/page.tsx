"use client";

import { ShieldCheck, CalendarRange } from "lucide-react";
import { TransactionCard, Transaction } from "@/components/payments/TransactionCard";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { memberPaymentsQuery } from "@/lib/client/memberQueries";
import { CardCollectionSkeleton } from "@/components/ui/loading-skeletons";

export default function PaymentsPage() {
  const router = useRouter();
  const { data: payments, isPending, error } = useQuery({
    ...memberPaymentsQuery,
    enabled: MEMBER_PAYMENTS_ENABLED,
  });

  useEffect(() => {
    if (!MEMBER_PAYMENTS_ENABLED) {
      router.replace("/member/dashboard");
      return;
    }

  }, [router]);

  const transactions: Transaction[] = (payments?.items ?? []).map((payment) => ({
    id: payment.id,
    date: new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    amount: payment.amount,
    method: payment.method.toUpperCase().includes("CASH") ? "CASH" : "UPI",
    status: payment.status,
    receiptUrl: payment.receiptUrl,
  }));

  const totalPaid = transactions.reduce((sum, tx) => sum + (tx.status === "COMPLETED" ? tx.amount : 0), 0);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#F6F8FC] animate-in fade-in duration-300 pb-24 md:pb-6 transition-colors dark:bg-slate-900">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 dark:text-slate-50">Payments History</h1>
        <p className="text-slate-500 text-sm dark:text-slate-400">View your past transactions and receipts.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5EAF3] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
              <ShieldCheck className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Active Member</span>
            </div>
          </div>
          <span className="text-slate-500 font-medium mb-1 dark:text-slate-400">Total Amount Paid</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50">₹{totalPaid}</span>
            <span className="text-slate-400 text-sm font-medium dark:text-slate-500">this year</span>
          </div>
        </div>
        
        {/* Visual Graphic for desktop to fill empty space elegantly */}
        <div className="flex items-center gap-4">
          <Link
            href="/pay?source=member"
            className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Pay Now
          </Link>
          <div className="hidden md:flex size-24 bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 rounded-full items-center justify-center shrink-0 transition-all hover:-translate-y-1 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:shadow-none">
            <CalendarRange className="size-10" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-slate-50">
          Recent Transactions
          <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full dark:bg-slate-700 dark:text-slate-300">{transactions.length}</span>
        </h2>
        
        <div className="flex flex-col gap-3">
          {isPending ? <CardCollectionSkeleton count={3} /> : error ? <p className="text-sm text-red-600">{error.message}</p> : transactions.length === 0 ? <p className="text-sm text-slate-500">No payment transactions yet.</p> : transactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>

    </div>
  );
}
