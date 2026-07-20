import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

interface DueStatusCardProps {
  amountDue: number;
}

export function DueStatusCard({ amountDue }: DueStatusCardProps) {
  const isClear = amountDue === 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF3] p-5 shadow-sm overflow-hidden relative transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">
            {isClear ? "Status" : "Outstanding Dues"}
          </h2>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${isClear ? 'text-green-600 dark:text-green-300' : 'text-slate-900 dark:text-slate-50'}`}>
              {isClear ? "All Clear" : `₹${amountDue}`}
            </span>
          </div>
        </div>
        
        <div className={`p-2 rounded-full ${isClear ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
          {isClear ? (
            <CheckCircle2 className="size-6 text-green-600 dark:text-green-300" />
          ) : (
            <AlertCircle className="size-6 text-red-500 dark:text-red-300" />
          )}
        </div>
      </div>

      {!isClear && MEMBER_PAYMENTS_ENABLED && (
        <div className="mt-5">
          <Link href="/pay?source=member" className="block w-full">
            <Button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
              Pay Now <ChevronRight className="size-4" />
            </Button>
          </Link>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium dark:text-slate-500">
            Clear your dues before the end of this month
          </p>
        </div>
      )}
    </div>
  );
}
