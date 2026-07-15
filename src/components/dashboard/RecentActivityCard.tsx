import { ReceiptText, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface Activity {
  id: string;
  date: string;
  amount?: number;
  type: string;
  status?: "completed" | "pending";
}

interface RecentActivityCardProps {
  activities?: Activity[];
}

export function RecentActivityCard({ activities = [] }: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-sm overflow-hidden transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      <div className="flex items-center justify-between p-4 border-b border-[#E5EAF3] dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-slate-50">Recent Activity</h3>
        <Link href="/member/payments" className="text-xs font-medium text-[#2563EB] flex items-center gap-1 hover:underline">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      
      <div className="divide-y divide-[#E5EAF3] dark:divide-slate-700">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors dark:hover:bg-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all hover:-translate-y-0.5 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:shadow-none dark:hover:bg-blue-500/15">
                  <ReceiptText className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{activity.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.date}</p>
                </div>
              </div>
              <div className="text-right">
                {activity.amount !== undefined && <p className="text-sm font-bold text-slate-900 dark:text-slate-50">₹{activity.amount}</p>}
                {activity.status && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activity.status === "completed" 
                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" 
                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  }`}>
                    {activity.status}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm dark:text-slate-400">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
}
