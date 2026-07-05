import { ReceiptText, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Activity {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: "completed" | "pending";
}

const mockActivities: Activity[] = [
  {
    id: "TXN10293",
    date: "July 2, 2026",
    amount: 100,
    type: "UPI Payment",
    status: "completed",
  },
  {
    id: "TXN10245",
    date: "June 1, 2026",
    amount: 100,
    type: "Cash Handover",
    status: "completed",
  },
];

export function RecentActivityCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E5EAF3]">
        <h3 className="font-bold text-slate-800">Recent Activity</h3>
        <Link href="/member/payments" className="text-xs font-medium text-[#2563EB] flex items-center gap-1 hover:underline">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      
      <div className="divide-y divide-[#E5EAF3]">
        {mockActivities.length > 0 ? (
          mockActivities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all hover:-translate-y-0.5">
                  <ReceiptText className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activity.type}</p>
                  <p className="text-xs text-slate-500">{activity.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">₹{activity.amount}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activity.status === "completed" 
                    ? "bg-green-50 text-green-700" 
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
}
