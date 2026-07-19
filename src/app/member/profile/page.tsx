"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { MemberProfileDetails, MemberProfileData } from "@/components/profile/MemberProfileDetails";
import { EditProfileDrawer } from "@/components/profile/EditProfileDrawer";
import { ContactAdminsDrawer } from "@/components/profile/ContactAdminsDrawer";
import { Fingerprint, MessageCircle, LogOut, ChevronRight, Edit3, CheckCircle2, Moon, Sun } from "lucide-react";
import type { MemberProfileDTO } from "@/lib/backend/dto/member.dto";
import type { SupportContactDTO } from "@/lib/backend/dto/support.dto";
import { BackendApiError } from "@/lib/api/backendClient";
import { logoutSession } from "@/lib/api/authClient";
import { getCurrentMemberProfile, updateCurrentMemberProfile } from "@/lib/api/memberClient";
import { getSupportContacts } from "@/lib/api/supportClient";

function toUiBloodGroup(value?: string): string {
  if (!value) return "";
  return value.endsWith("+") ? `${value}ve` : value.replace(/-$/, "-ve");
}

function toDatabaseBloodGroup(value: string): string {
  return value.replace(/\+ve$/, "+").replace(/-ve$/, "-");
}

function mapProfile(profile: MemberProfileDTO): MemberProfileData {
  return {
    id: profile.memberCode,
    name: profile.name,
    initials: profile.initials,
    age: profile.age ?? 0,
    bloodGroup: toUiBloodGroup(profile.bloodGroup),
    phone: profile.phone,
    whatsapp: profile.whatsapp ?? "",
    address: profile.address ?? "",
    unit: profile.unit ?? "",
    sector: profile.sector ?? "",
    joinedYear: profile.joinedYear ?? "",
    occupation: profile.occupation ?? "",
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [member, setMember] = useState<MemberProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<SupportContactDTO[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let active = true;
    getCurrentMemberProfile()
      .then((profile) => {
        if (!active) return;
        setMember(mapProfile(profile));
        setIsBiometricEnabled(profile.biometricEnabled);
      })
      .catch((error: unknown) => {
        if (error instanceof BackendApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    getSupportContacts()
      .then((result) => {
        if (active) setContacts(result);
      })
      .catch((error: unknown) => {
        if (active) setContactsError(error instanceof Error ? error.message : "Unable to load contacts.");
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleSaveProfile = async (updatedMember: MemberProfileData) => {
    setIsSaving(true);
    try {
      const profile = await updateCurrentMemberProfile({
        name: updatedMember.name,
        whatsapp: updatedMember.whatsapp,
        age: updatedMember.age,
        bloodGroup: toDatabaseBloodGroup(updatedMember.bloodGroup),
        address: updatedMember.address,
        occupation: updatedMember.occupation,
      });
      setMember(mapProfile(profile));
      setIsBiometricEnabled(profile.biometricEnabled);
      setIsEditDrawerOpen(false);
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#F6F8FC] animate-in fade-in duration-300 pb-24 md:pb-6 relative transition-colors dark:bg-slate-900">

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="size-5 text-green-400" />
          <p className="text-sm font-medium">Profile updated successfully!</p>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 dark:text-slate-50">My Profile</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Manage your personal information.</p>
        </div>
        <button
          onClick={() => member && setIsEditDrawerOpen(true)}
          disabled={!member || isLoading}
          className="flex items-center gap-1.5 bg-white text-blue-600 px-3 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 hover:bg-blue-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:shadow-none dark:hover:bg-slate-700"
        >
          <Edit3 className="size-4" />
          <span className="hidden md:inline">Edit Profile</span>
        </button>
      </div>

      {/* Main Profile Card */}
      {isLoading && <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Loading profile...</p>}
      {loadError && <p className="mb-6 text-sm text-red-600 dark:text-red-400">{loadError}</p>}
      {member && <MemberProfileDetails member={member} />}

      {/* Settings Section */}
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 px-2 dark:text-slate-50">Settings & Security</h2>

      <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-sm overflow-hidden mb-6 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
        <div className="p-4 flex items-center justify-between border-b border-[#E5EAF3] group md:hidden dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-slate-100 border border-slate-200 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all group-hover:-translate-y-0.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none">
              {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm dark:text-slate-50">Dark Mode</p>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Use the slight-blue-dark theme</p>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={isDark}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isDark ? "bg-blue-600" : "bg-slate-200"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDark ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Biometric Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-[#E5EAF3] group dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all group-hover:-translate-y-0.5 text-blue-600">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm dark:text-slate-50">Biometric Login</p>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Not enabled yet; PIN login remains active</p>
            </div>
          </div>

          {/* Custom Toggle Switch */}
          <button
            type="button"
            disabled
            title="Biometric authentication is not enabled yet"
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-not-allowed opacity-60 ${isBiometricEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {/* WhatsApp Support */}
        <button onClick={() => setIsContactDrawerOpen(true)} className="w-full p-4 flex items-center justify-between border-b border-[#E5EAF3] hover:bg-slate-50 transition-colors group text-left dark:border-slate-700 dark:hover:bg-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-[#ebf8ee] border border-[#25D366]/20 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all group-hover:-translate-y-0.5 text-[#25D366]">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm dark:text-slate-50">Chat with Admins</p>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Contact committee members</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Logout */}
        <button
          onClick={async () => {
            await logoutSession();
            router.push("/");
          }}
          className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left group dark:hover:bg-red-500/10"
        >
          <div className="size-11 rounded-full bg-red-50 border border-red-100 shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all group-hover:-translate-y-0.5 text-red-600">
            <LogOut className="size-5" />
          </div>
          <div>
            <p className="font-bold text-red-600 text-sm">Log Out</p>
            <p className="text-xs text-red-400 mt-0.5">Securely sign out of your account</p>
          </div>
        </button>

      </div>

      {/* Edit Profile Drawer / Modal */}
      {member && isEditDrawerOpen && (
        <EditProfileDrawer
          isOpen
          onClose={() => setIsEditDrawerOpen(false)}
          member={member}
          onSave={handleSaveProfile}
          isSaving={isSaving}
        />
      )}

      {/* Contact Admins Drawer */}
      <ContactAdminsDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => setIsContactDrawerOpen(false)}
        contacts={contacts}
        isLoading={contactsLoading}
        error={contactsError}
      />

    </div>
  );
}
