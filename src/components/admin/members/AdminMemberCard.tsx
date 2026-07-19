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

interface AdminMemberCardProps {
  member: Member;
}

export function AdminMemberCard({ member }: AdminMemberCardProps) {
  const router = useRouter();
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const isDefaulter = member.duesPending > 0;

  return (
    <div
      onClick={() => router.push(`/admin/members/${member.id}`)}
      className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-3 sm:hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium">
            {member.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 leading-tight">{member.name}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{member.memberId}</div>
          </div>
        </div>
        <Badge variant={member.status === "active" ? "success" : "secondary"}>
          {member.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-3">
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Phone</div>
          <div className="font-mono text-slate-700 dark:text-slate-300">{member.phone}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Area</div>
          <div className="text-slate-700 dark:text-slate-300 truncate">{member.area}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Monthly Due</div>
          <div className="text-slate-700 dark:text-slate-300">₹{member.monthlyAmount} <span className="text-xs text-slate-500 capitalize">({member.monthlyTier})</span></div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-0.5">Status</div>
          {isDefaulter ? (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowPaymentWarning(true);
               }}
               className="text-red-600 dark:text-red-400 flex items-center text-xs mt-0.5 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded cursor-pointer hover:underline w-fit"
             >
               <Clock className="w-3 h-3 mr-1" /> Overdue
             </button>
          ) : (
             <div className="text-green-600 dark:text-green-400 flex items-center text-xs mt-0.5 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-fit">
               <CheckCircle2 className="w-3 h-3 mr-1" /> Clear
             </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-1">
        <div className="flex gap-2">
          {member.bloodGroup && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shadow-[0_2px_8px_rgba(220,38,38,0.08)]">
              <Droplet className="w-4 h-4 mr-1.5 fill-red-100 dark:fill-red-900/50 text-red-500" />
              {member.bloodGroup} {member.isBloodDonor ? "(Donor)" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <MemberInvitationAction member={member} compact />
          <AdminActionIcon aria-label="View Details" className="h-8 w-8 pointer-events-none">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </AdminActionIcon>
        </div>
      </div>

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
    </div>
  );
}
