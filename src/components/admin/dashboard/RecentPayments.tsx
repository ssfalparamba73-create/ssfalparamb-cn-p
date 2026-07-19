"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardRecentPaymentDTO } from "@/lib/backend/dto/dashboard.dto";

interface RecentPaymentsProps {
  payments: DashboardRecentPaymentDTO[];
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-700/40">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:shadow-none">
                  {payment.payerName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{payment.payerName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-mono dark:text-slate-400">{payment.receiptId}</span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(payment.paidAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-50">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <Badge
                    variant="outline"
                    className={
                      payment.category === "special_event"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }
                  >
                    {payment.category === "special_event" ? "Event" : "Dues"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      payment.status === "confirmed" ? "bg-green-50 text-green-700 border-green-200" :
                      payment.status === "pending" ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
