"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, MessageCircle, HeartPulse, X } from "lucide-react";
import { MemberDetailDrawer, MemberStats } from "@/components/directory/MemberDetailDrawer";
import { Input } from "@/components/ui/input";
import type { BloodGroup, MemberDirectoryItemDTO } from "@/lib/backend/dto/member.dto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getMemberDirectory } from "@/lib/api/memberClient";

const BLOOD_GROUPS = ["O+ve", "O-ve", "A+ve", "A-ve", "B+ve", "B-ve", "AB+ve", "AB-ve"];

function toDatabaseBloodGroup(value: string | null): BloodGroup | undefined {
  return value ? value.replace("ve", "") as BloodGroup : undefined;
}

function toDisplayBloodGroup(value?: BloodGroup): string {
  return value ? `${value}ve` : "--";
}

function toMemberStats(member: MemberDirectoryItemDTO): MemberStats {
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    phone: member.phone ?? "",
    bloodGroup: toDisplayBloodGroup(member.bloodGroup),
    paidPercentage: member.paymentProgressPercent,
  };
}

export default function DirectoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [isBloodGroupModalOpen, setIsBloodGroupModalOpen] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      getMemberDirectory({
        search: searchQuery.trim() || undefined,
        bloodGroup: toDatabaseBloodGroup(selectedBloodGroup),
        donorAvailable: selectedBloodGroup ? true : undefined,
      })
        .then((result) => {
          if (!active) return;
          setMembers(result.items.map(toMemberStats));
          setLoadError(null);
        })
        .catch((error: unknown) => {
          if (!active) return;
          if (error instanceof BackendApiError && error.status === 401) {
            router.replace("/login");
            return;
          }
          setMembers([]);
          setLoadError(error instanceof Error ? error.message : "Unable to load members.");
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [router, searchQuery, selectedBloodGroup]);

  const filteredMembers = members;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#F6F8FC] animate-in fade-in duration-300 pb-24 md:pb-6 transition-colors dark:bg-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 dark:text-slate-50">Community</h1>
        <p className="text-slate-500 text-sm dark:text-slate-400">Find and connect with other members.</p>
      </div>

      {/* Search Bar with Blood Group Button */}
      <div className="relative mb-6 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search name, phone or blood group..."
            className="pl-10 pr-[52px] h-14 rounded-2xl bg-white border-[#E5EAF3] shadow-sm text-base dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            value={searchQuery}
            onChange={(e) => {
              setIsLoading(true);
              setSearchQuery(e.target.value);
            }}
          />
          {/* Blood Group Filter Button (Inside Input) */}
          <button
            onClick={() => setIsBloodGroupModalOpen(true)}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 size-11 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
              selectedBloodGroup
                ? 'bg-red-500 border border-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)]'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-red-500 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-red-300 dark:shadow-none dark:hover:bg-red-500/10'
            }`}
            title="Filter by Blood Group"
          >
            <HeartPulse className="size-5" />
            {selectedBloodGroup && (
              <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-white border-2 border-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {selectedBloodGroup && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl p-3 mb-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              Showing <span className="font-bold">{selectedBloodGroup}</span> donors
            </span>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              setSelectedBloodGroup(null);
            }}
            className="text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Member List */}
      <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-sm overflow-hidden transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
        <div className="divide-y divide-[#E5EAF3] dark:divide-slate-700">
          {isLoading && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading members...
            </div>
          )}
          {loadError && !isLoading && (
            <div className="p-6 text-center text-sm text-red-600 dark:text-red-300">
              {loadError}
            </div>
          )}
          {!isLoading && !loadError && filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isBloodGroupSearched = searchQuery && member.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase());
              const showBloodBadge = selectedBloodGroup !== null || isBloodGroupSearched;

              return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-slate-700/60"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 dark:border-slate-700 dark:bg-blue-500/10 dark:text-blue-300 dark:shadow-none">
                    {member.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 leading-tight dark:text-slate-50">{member.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{member.phone}</span>
                      {showBloodBadge && (
                        <span className="inline-flex items-center justify-center px-2 py-[2px] rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold tracking-wide animate-in zoom-in duration-200">
                          {member.bloodGroup}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions (Stops propagation so it doesn't open drawer) */}
                {member.phone && <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="size-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-[#25D366] flex items-center justify-center hover:bg-[#ebf8ee] transition-all hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:bg-green-500/10"
                  >
                    <MessageCircle className="size-5" />
                  </a>
                  <a
                    href={`tel:${member.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="size-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:shadow-none dark:hover:bg-blue-500/10"
                  >
                    <Phone className="size-5" />
                  </a>
                </div>}
              </div>
            );
            })
          ) : !isLoading && !loadError ? (
            <div className="p-10 text-center flex flex-col items-center">
              <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <HeartPulse className="size-5 text-red-500" />
              </div>
              <p className="text-slate-900 font-bold dark:text-slate-50">No donors found</p>
              <p className="text-sm text-slate-500 mt-1 max-w-[200px] dark:text-slate-400">
                We couldn&apos;t find anyone with the {selectedBloodGroup} blood group.
              </p>
              {selectedBloodGroup && (
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setSelectedBloodGroup(null);
                  }}
                  className="mt-4 text-sm font-bold text-red-600 hover:text-red-700"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Detail Drawer */}
      <MemberDetailDrawer
        isOpen={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />

      {/* Blood Group Filter Modal/Drawer */}
      {isBloodGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center p-0 md:justify-center md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={() => setIsBloodGroupModalOpen(false)} />
          <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-[32px] rounded-b-none md:rounded-3xl shadow-2xl pt-8 pb-10 px-6 md:p-6 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 dark:border dark:border-slate-700 dark:bg-slate-800">

            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden dark:bg-slate-700" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
                  <HeartPulse className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight dark:text-slate-50">Select Blood Group</h3>
                  <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Find emergency blood donors</p>
                </div>
              </div>
              <button
                onClick={() => setIsBloodGroupModalOpen(false)}
                className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => {
                    setIsLoading(true);
                    setSelectedBloodGroup(bg === selectedBloodGroup ? null : bg);
                    setIsBloodGroupModalOpen(false);
                  }}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    selectedBloodGroup === bg
                      ? 'bg-red-500 border-red-500 text-white shadow-md scale-105'
                      : 'bg-white border-slate-100 text-slate-700 hover:border-red-200 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-500/40 dark:hover:bg-red-500/10'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            {selectedBloodGroup && (
              <button
                onClick={() => {
                  setIsLoading(true);
                  setSelectedBloodGroup(null);
                  setIsBloodGroupModalOpen(false);
                }}
                className="w-full mt-6 py-3 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
