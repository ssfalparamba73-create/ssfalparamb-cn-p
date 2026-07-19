"use client";

import React, { useState } from "react";
import { ChevronRight, Droplet, Clock, CheckCircle2 } from "lucide-react";
import { Member } from "@/lib/admin/admin-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActionIcon } from "@/components/admin/layout/AdminActionIcon";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MemberInvitationAction } from "./MemberInvitationAction";

interface AdminMemberRowProps {
  member: Member;
}

export function AdminMemberRow({ member }: AdminMemberRowProps) {
  const router = useRouter();
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const isDefaulter = member.duesPending > 0;

  return (
    <tr
      onClick={() => router.push(`/admin/members/${member.id}`)}
      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
    >
      <td className="py-4 pl-4 pr-3 sm:pl-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium">
            {member.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100">{member.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{member.memberId}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="font-mono">{member.phone}</div>
        <div className="text-xs text-slate-500">{member.area}</div>
      </td>
      <td className="px-3 py-4">
        {member.bloodGroup && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shadow-[0_2px_8px_rgba(220,38,38,0.08)] transition-all">
            <Droplet className="w-3.5 h-3.5 mr-1.5 fill-red-100 dark:fill-red-900/50 text-red-500" />
            {member.bloodGroup}
          </span>
        )}
      </td>
      <td className="px-3 py-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            ₹{member.monthlyAmount}
          </span>
          <span className="text-xs text-slate-500 capitalize">/ {member.monthlyTier}</span>
        </div>
        {isDefaulter ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPaymentWarning(true);
            }}
            className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1 hover:underline cursor-pointer bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </button>
        ) : (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-fit">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Clear
          </div>
        )}
      </td>
      <td className="px-3 py-4">
        <Badge variant={member.status === "active" ? "success" : "secondary"}>
          {member.status}
        </Badge>
      </td>
      <td className="py-4 pr-4 pl-3 sm:pr-6 text-right">
        <div className="flex justify-end gap-2">
           <MemberInvitationAction member={member} compact />
           <AdminActionIcon aria-label="View Details" className="h-8 w-8 pointer-events-none">
             <ChevronRight className="w-4 h-4 text-slate-400" />
           </AdminActionIcon>
        </div>
      </td>

      {/* Warning Modal */}
      {showPaymentWarning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Mark as Paid?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Payment recording is not connected yet. <span className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</span>&apos;s pending dues will not be changed.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaymentWarning(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaymentWarning(false);
                  toast.info("Payment recording will be enabled in the payment phase.");
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      )}
    </tr>
  );
}
