"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Key, Banknote, Phone, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberDetailTabs } from "@/components/admin/members/MemberDetailTabs";
import type { Member } from "@/lib/admin/admin-types";
import { mapMemberDto } from "@/lib/admin/mapMemberDto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getAdminMember, issueAdminMemberPin } from "@/lib/api/memberClient";
import type { IssuedMemberPinDTO } from "@/lib/backend/dto/member.dto";
import { toast } from "sonner";
import { MemberInvitationDialog } from "@/components/admin/members/MemberInvitationDialog";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issuedPin, setIssuedPin] = useState<IssuedMemberPinDTO | null>(null);
  const [isIssuingPin, setIsIssuingPin] = useState(false);
  const memberId = typeof params.id === "string" ? params.id : null;

  useEffect(() => {
    let active = true;
    if (!memberId) return;

    getAdminMember(memberId)
      .then((result) => {
        if (active) setMember(mapMemberDto(result));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof BackendApiError && requestError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active && !(requestError instanceof BackendApiError && requestError.status === 404)) {
          setLoadError(requestError instanceof Error ? requestError.message : "Unable to load member.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, router]);

  if (!memberId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Member Not Found</h2>
        <Button onClick={() => router.push("/admin/members")}>Back to Directory</Button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading member...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Member Not Found</h2>
        <p className="text-slate-500 mb-6">The member record you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push("/admin/members")}>Back to Directory</Button>
      </div>
    );
  }

  const isDefaulter = member.duesPending > 0;

  const handleIssuePin = async () => {
    if (!window.confirm("Generate a new PIN and invitation? The old PIN will stop working and any existing member login session will end.")) return;
    setIsIssuingPin(true);
    try {
      setIssuedPin(await issueAdminMemberPin(member.id));
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Unable to generate PIN.");
    } finally {
      setIsIssuingPin(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">

      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/admin/members")}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Back to Directory</div>
      </div>

      {/* Member Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
           <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl text-slate-600 dark:text-slate-300 font-bold shrink-0">
                {member.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                 <div className="flex flex-wrap items-center gap-2 mb-1">
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{member.name}</h2>
                   <Badge variant={member.status === "active" ? "success" : "secondary"} className="ml-2">
                     {member.status}
                   </Badge>
                   {isDefaulter && (
                     <Badge variant="destructive" className="flex items-center">
                       <Clock className="w-3 h-3 mr-1" /> Overdue
                     </Badge>
                   )}
                 </div>
                 <div className="text-slate-500 dark:text-slate-400 font-mono mb-2">{member.memberId}</div>

                 <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-4">
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="font-mono">{member.phone}</span>
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <div className="w-4 h-4 mr-2 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">₹</div>
                      <span>{member.monthlyAmount} / {member.monthlyTier}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto mt-6 md:mt-0">
                <Button onClick={() => router.push(`/admin/members/${member.id}/edit`)} variant="outline" className="w-full md:w-auto h-10 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              <Button onClick={handleIssuePin} disabled={isIssuingPin || member.status !== "active"} variant="outline" className="w-full h-10 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300">
                <Key className="w-4 h-4 mr-2" /> {isIssuingPin ? "Generating..." : "Reset PIN"}
              </Button>
              <Button onClick={() => toast.info("Cash recording will be enabled in the payment phase.")} className="col-span-2 md:col-auto w-full h-10 bg-blue-600 hover:bg-blue-700 text-white">
                <Banknote className="w-4 h-4 mr-2" /> Record Cash
              </Button>
           </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <MemberDetailTabs member={member} />

      {issuedPin && (
        <MemberInvitationDialog
          memberName={issuedPin.memberName}
          phone={issuedPin.phone}
          pin={issuedPin.pin}
          message={issuedPin.message}
          title="Member invitation ready"
          description="Share this new login invitation now. The previous PIN no longer works, and this PIN is shown only once."
          onClose={() => setIssuedPin(null)}
        />
      )}

    </div>
  );
}
