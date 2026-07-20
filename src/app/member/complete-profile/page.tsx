"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LogOut, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logoutSession } from "@/lib/api/authClient";
import { completeCurrentMemberProfile, getCurrentMemberProfile } from "@/lib/api/memberClient";
import type { MemberProfileDTO } from "@/lib/backend/dto/member.dto";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const INPUT_CLASS = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20";

interface CompletionFormState {
  whatsapp: string;
  age: string;
  bloodGroup: string;
  address: string;
  occupation: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfileDTO | null>(null);
  const [form, setForm] = useState<CompletionFormState>({ whatsapp: "", age: "", bloodGroup: "", address: "", occupation: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentMemberProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setForm({
          whatsapp: result.whatsapp || result.phone,
          age: result.age == null ? "" : String(result.age),
          bloodGroup: result.bloodGroup || "",
          address: result.address || "",
          occupation: result.occupation || "",
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load your profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field: keyof CompletionFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const age = Number(form.age);
    if (!form.whatsapp.trim() || !Number.isInteger(age) || age < 0 || age > 130 || !form.bloodGroup || !form.address.trim() || !form.occupation.trim()) {
      setError("Please complete every required field with valid information.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await completeCurrentMemberProfile({
        whatsapp: form.whatsapp,
        age,
        bloodGroup: form.bloodGroup,
        address: form.address,
        occupation: form.occupation,
      });
      toast.success("Profile completed successfully.");
      window.location.replace("/member/dashboard");
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

  if (isLoading || !profile) {
    return <div className="min-h-screen flex items-center justify-center px-4"><p className={`text-sm ${error ? "text-red-600" : "text-slate-500"}`}>{error ?? "Loading your details..."}</p></div>;
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
          <ReadOnlyField label="Full Name" value={profile.name} />
          <ReadOnlyField label="Phone Number" value={profile.phone} />

          <FormField label="Age" required>
            <input type="number" min="0" max="130" value={form.age} onChange={(event) => updateField("age", event.target.value)} className={INPUT_CLASS} required />
          </FormField>
          <FormField label="Blood Group" required>
            <Select value={form.bloodGroup} onValueChange={(value) => updateField("bloodGroup", value)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="WhatsApp Number" required>
            <input type="tel" inputMode="tel" value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} className={INPUT_CLASS} required />
          </FormField>
          <FormField label="Occupation" required>
            <input type="text" maxLength={120} value={form.occupation} onChange={(event) => updateField("occupation", event.target.value)} className={INPUT_CLASS} required />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address / House Name" required>
              <textarea rows={4} maxLength={500} value={form.address} onChange={(event) => updateField("address", event.target.value)} className={`${INPUT_CLASS} resize-none`} required />
            </FormField>
          </div>
          {(profile.unit || profile.sector) && (
            <>
              <ReadOnlyField label="Unit" value={profile.unit || "--"} />
              <ReadOnlyField label="Sector" value={profile.sector || "--"} />
            </>
          )}
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
