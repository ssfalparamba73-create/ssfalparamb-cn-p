"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LogOut, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logoutSession } from "@/lib/api/authClient";
import { completeCurrentMemberProfile } from "@/lib/api/memberClient";
import { FormPageSkeleton } from "@/components/ui/loading-skeletons";
import {
  memberDashboardQuery,
  memberProfileQuery,
  memberQueryKeys,
  memberSessionQuery,
} from "@/lib/client/memberQueries";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const INPUT_CLASS = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20";

interface CompletionFormState {
  whatsapp: string;
  dateOfBirth: string;
  bloodGroup: string;
  donorAvailable: boolean | null;
  isStudent: boolean | null;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profileQuery = useQuery(memberProfileQuery);
  const [form, setForm] = useState<CompletionFormState>({
    whatsapp: "", dateOfBirth: "", bloodGroup: "", donorAvailable: true, isStudent: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedForm = useRef(false);

  useEffect(() => {
    const result = profileQuery.data;
    if (!result || hasInitializedForm.current) return;
    hasInitializedForm.current = true;
    setForm({
      whatsapp: result.whatsapp || result.phone,
      dateOfBirth: result.dateOfBirth || "",
      bloodGroup: result.bloodGroup || "",
      donorAvailable: true,
      isStudent: result.isStudent,
    });
  }, [profileQuery.data]);

  const profile = profileQuery.data;

  const updateField = <K extends keyof CompletionFormState>(field: K, value: CompletionFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.whatsapp.trim() || !form.dateOfBirth || !form.bloodGroup || form.donorAvailable === null || form.isStudent === null) {
      setError("Please complete every required field with valid information.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const completedProfile = await completeCurrentMemberProfile({
        whatsapp: form.whatsapp,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        donorAvailable: form.donorAvailable,
        isStudent: form.isStudent,
      });
      queryClient.setQueryData(memberQueryKeys.profile, completedProfile);
      queryClient.setQueryData(memberSessionQuery.queryKey, (current) =>
        current ? { ...current, profileComplete: true } : current
      );
      await queryClient.invalidateQueries({ queryKey: memberDashboardQuery.queryKey });
      toast.success("Profile completed successfully.");
      router.replace("/member/dashboard");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to complete your profile.");
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  };

  if (profileQuery.isPending || !profile) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-6 md:py-10">
        {profileQuery.error
          ? <p className="text-sm text-red-600">{profileQuery.error.message}</p>
          : <FormPageSkeleton />}
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><ShieldCheck className="size-4" /> First login</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Complete your profile</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Confirm your details to continue to the member dashboard.</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><LogOut className="size-4" /> Logout</button>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-sm md:p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReadOnlyField label="Name" value={profile.name} />

          <FormField label="WhatsApp Number" required>
            <input type="tel" inputMode="tel" value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} className={INPUT_CLASS} required />
          </FormField>
          <FormField label="Date of Birth" required>
            <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} className={INPUT_CLASS} required />
          </FormField>
          <FormField label="Blood Group" required>
            <Select value={form.bloodGroup} onValueChange={(value) => updateField("bloodGroup", value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Ready to donate?" required>
            <Select value={form.donorAvailable === null ? "" : String(form.donorAvailable)} onValueChange={(value) => updateField("donorAvailable", value === "true")}>
              <SelectTrigger className={`h-11 w-full rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${form.donorAvailable ? "text-red-600 dark:text-red-400" : ""}`}><SelectValue placeholder="Choose Yes or No" /></SelectTrigger>
              <SelectContent><SelectItem value="true" className="text-red-600 focus:text-red-700 dark:text-red-400">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
            </Select>
          </FormField>
          <FormField label="Are you a student?" required>
            <Select value={form.isStudent === null ? "" : String(form.isStudent)} onValueChange={(value) => updateField("isStudent", value === "true")}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Choose Yes or No" /></SelectTrigger>
              <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
            </Select>
          </FormField>
        </div>
        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={isSaving} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"><Save className="size-5" /> {isSaving ? "Saving..." : "Save & Continue"}</button>
      </form>
    </main>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <FormField label={label}><input type="text" value={value} readOnly aria-readonly="true" className={`${INPUT_CLASS} cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400`} /></FormField>;
}
