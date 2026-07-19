import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { DashboardRecentCashHandoverDTO } from "@/lib/backend/dto/dashboard.dto";

export function RecentCashHandovers({
  handovers,
}: {
  handovers: DashboardRecentCashHandoverDTO[];
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Recent Cash Handovers
        </CardTitle>
        <Link href="/admin/cash-entry" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {handovers.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            No recent cash handovers found.
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {handovers.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">₹{item.amount.toLocaleString("en-IN")}</span>
                    {item.status === "pending" ? (
                      <Badge variant="outline" className="text-[10px] uppercase text-amber-600 bg-amber-50 border-amber-200">Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase text-green-600 bg-green-50 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1 inline"/> Verified</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    From <span className="font-medium text-slate-700 dark:text-slate-300">{item.adminName}</span> • {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.date))}
                  </div>
                </div>
                {item.status === "pending" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                    Verify
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
