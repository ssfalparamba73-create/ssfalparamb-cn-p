"use client";

import React, { useEffect, useState } from "react";
import { MemberForm } from "@/components/admin/members/MemberForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Member } from "@/lib/admin/admin-types";
import { mapMemberDto } from "@/lib/admin/mapMemberDto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getAdminMember } from "@/lib/api/memberClient";

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = typeof params.id === "string" ? params.id : null;
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(memberId));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!memberId) {
      return;
    }

    getAdminMember(memberId)
      .then((result) => {
        if (active) setMember(mapMemberDto(result));
      })
      .catch((error: unknown) => {
        if (error instanceof BackendApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active && !(error instanceof BackendApiError && error.status === 404)) {
          setLoadError(error instanceof Error ? error.message : "Unable to load member.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, router]);

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
        <Button onClick={() => router.push("/admin/members")}>Back to Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/admin/members/${member.id}`} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Edit Member</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update {member.name}&apos;s profile.</p>
        </div>
      </div>

      <MemberForm isEdit={true} initialData={member} />
    </div>
  );
}
