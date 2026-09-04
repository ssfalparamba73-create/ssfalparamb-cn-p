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
    <div className="bg-white rounded-2xl border border-[#E5EAF3] p-5 shadow-sm overflow-hidden relative transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">
            {isClear || isPending || isFailed ? "Status" : "Outstanding Dues"}
          </h2>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${isClear ? 'text-green-600 dark:text-green-300' : 'text-slate-900 dark:text-slate-50'}`}>
              {label}
            </span>
          </div>
        </div>
        
        <div className={`p-2 rounded-full ${isClear ? 'bg-green-50 dark:bg-green-500/10' : isPending ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
          {isClear ? (
            <CheckCircle2 className="size-6 text-green-600 dark:text-green-300" />
          ) : isPending ? (
            <AlertCircle className="size-6 text-amber-600 dark:text-amber-300" />
          ) : (
            <AlertCircle className="size-6 text-red-500 dark:text-red-300" />
          )}
        </div>
      </div>

      {MEMBER_PAYMENTS_ENABLED && (
        <div className="mt-5">
          <Link href="/pay?source=member" className="block w-full">
            <Button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
              Pay Now <ChevronRight className="size-4" />
            </Button>
          </Link>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium dark:text-slate-500">
            {isClear ? "Make a payment or pay upcoming dues" : isPending ? "Your payment is being verified" : isFailed ? "Retry the payment or contact support" : "Complete your payment"}
          </p>
        </div>
      )}
    </div>
  );
}
