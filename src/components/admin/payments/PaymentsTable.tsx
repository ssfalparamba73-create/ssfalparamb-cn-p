"use client";

import React, { useState } from "react";
import { Search, Filter, SlidersHorizontal, MoreHorizontal, ExternalLink, Receipt, Building, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { MOCK_PAYMENTS } from "@/lib/admin/mock-data";

export function PaymentsTable() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 shadow-none">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 shadow-none">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category === "monthly_dues") return <Receipt className="size-4 text-blue-500" />;
    return <Building className="size-4 text-amber-500" />;
  };

  const formatMethod = (method: string) => {
    return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Map central MOCK_PAYMENTS to the shape expected by the table
  const tablePayments = MOCK_PAYMENTS.map(p => ({
    id: p.id,
    receiptId: p.receiptId,
    memberName: p.payerName || "Unknown",
    memberId: p.memberId || "N/A",
    category: p.category,
    method: p.method,
    amount: p.amount,
    status: p.status,
    date: new Date(p.paidAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
    eventName: p.eventName
  }));

  const filteredPayments = tablePayments.filter(payment => {
    const searchLower = search.toLowerCase();
    const matchesSearch = search === "" || 
      payment.receiptId.toLowerCase().includes(searchLower) || 
      payment.memberName.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === "all" || payment.category === categoryFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesCategory && matchesMethod;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by receipt ID, member, or phone..." 
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center flex-wrap gap-2 pb-1 lg:pb-0">
          <div className="relative min-w-[140px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={cn(
                "w-full transition-colors",
                categoryFilter !== "all" 
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              )}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="monthly_dues">Monthly Dues</SelectItem>
                <SelectItem value="special_event">Special Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative min-w-[140px]">
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className={cn(
                "w-full transition-colors",
                methodFilter !== "all" 
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              )}>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="qr_code">QR Code</SelectItem>
                <SelectItem value="cash_handover">Cash Handover</SelectItem>
                <SelectItem value="admin_cash">Admin Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">{"Receipt ID & Date"}</th>
                <th className="px-4 py-3 font-medium">{"Member"}</th>
                <th className="px-4 py-3 font-medium">{"Category"}</th>
                <th className="px-4 py-3 font-medium">{"Method"}</th>
                <th className="px-4 py-3 font-medium text-right">{"Amount"}</th>
                <th className="px-4 py-3 font-medium text-center">{"Status"}</th>
                <th className="px-4 py-3 font-medium text-right">{"Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{payment.receiptId}</div>
                    <div className="text-xs text-slate-500">{payment.date}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{payment.memberName}</div>
                    <div className="text-xs text-slate-500">{payment.memberId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(payment.category)}
                      <span className="text-slate-700 dark:text-slate-300">
                        {payment.category === "monthly_dues" ? "Monthly Dues" : payment.eventName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 dark:text-slate-400">{formatMethod(payment.method)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">₹{payment.amount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/receipt/${payment.id}`} target="_blank">
                        <Button variant="ghost" size="icon" aria-label={`View public receipt for ${payment.receiptId}`} className="size-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Public Receipt">
                          <ExternalLink className="size-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/payments/${payment.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium">
                          {"Details"}
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredPayments.map((payment) => (
          <div key={payment.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">₹{payment.amount}</div>
                <div className="text-xs text-slate-500">{payment.receiptId} • {payment.date}</div>
              </div>
              {getStatusBadge(payment.status)}
            </div>
            
            <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <User className="size-4 text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{payment.memberName}</span>
              <span className="text-slate-400 text-xs ml-auto">{payment.memberId}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                {getCategoryIcon(payment.category)}
                <span className="truncate max-w-[120px]">
                  {payment.category === "monthly_dues" ? "Monthly Dues" : payment.eventName}
                </span>
              </div>
              <span className="text-xs text-slate-500">{formatMethod(payment.method)}</span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <Link href={`/admin/payments/${payment.id}`} className="flex-1">
                <Button variant="outline" className="w-full text-xs h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
