import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

interface DueStatusCardProps {
  amountDue: number;
  paymentStatus: "all_clear" | "payment_pending" | "contribution_due" | "payment_failed";
}

export function DueStatusCard({ amountDue, paymentStatus }: DueStatusCardProps) {
  const isClear = paymentStatus === "all_clear";
  const isPending = paymentStatus === "payment_pending";
  const isFailed = paymentStatus === "payment_failed";
  const label = isClear ? "All Clear" : isPending ? "Payment Pending" : isFailed ? "Payment Failed" : `₹${amountDue}`;

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.06)] transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {isClear || isPending || isFailed ? "Status" : "Outstanding subscriptions"}
          </h2>
          <div className="flex items-end gap-2">
            <span className={`text-[34px] leading-tight font-bold tracking-tight ${isClear ? 'text-green-600 dark:text-green-300' : 'text-slate-900 dark:text-slate-50'}`}>
              {label}
            </span>
          </div>
        </div>
        
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${isClear ? 'bg-green-50 dark:bg-green-500/10' : isPending ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
          {isClear ? (
            <CheckCircle2 className="size-7 text-green-600 dark:text-green-300" />
          ) : isPending ? (
            <AlertCircle className="size-7 text-amber-600 dark:text-amber-300" />
          ) : (
            <AlertCircle className="size-7 text-red-500 dark:text-red-300" />
          )}
        </div>
      </div>

      {MEMBER_PAYMENTS_ENABLED && (
        <div className="mt-5">
          <Link href="/pay?source=member" className="block w-full">
            <Button className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]">
              Pay Now <ChevronRight className="size-4" />
            </Button>
          </Link>
          <p className="mt-3 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
            {isClear ? "Make a payment or pay upcoming subscriptions" : isPending ? "Your payment is being verified" : isFailed ? "Retry the payment or contact support" : "Complete your payment"}
          </p>
        </div>
      )}
    </div>
  );
}

