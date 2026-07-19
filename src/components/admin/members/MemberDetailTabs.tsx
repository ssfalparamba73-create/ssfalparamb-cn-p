"use client";

import React, { useState } from "react";
import type { Member } from "@/lib/admin/admin-types";
import { Activity, CreditCard, Droplet, FileText, History, Users } from "lucide-react";

interface MemberDetailTabsProps {
  member: Member;
}

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "family", label: "Family", icon: Users },
  { id: "donor", label: "Blood Donor", icon: Droplet },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "audit", label: "Audit", icon: History },
] as const;

export function MemberDetailTabs({ member }: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("overview");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <nav className="grid grid-cols-2 md:flex md:items-center p-2 md:p-0 md:px-4 gap-2 md:gap-0" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 md:py-4 px-3 md:px-4 md:border-b-2 rounded-lg md:rounded-none font-medium text-sm flex items-center justify-center md:justify-start gap-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 md:bg-transparent md:border-blue-600 text-blue-700 md:text-blue-600 dark:bg-blue-900/20 dark:md:bg-transparent dark:md:border-blue-500 dark:text-blue-400"
                  : "md:border-transparent text-slate-600 md:text-slate-500 hover:bg-slate-50 md:hover:bg-transparent md:hover:text-slate-700 md:hover:border-slate-300 dark:text-slate-300 dark:md:text-slate-400 dark:hover:bg-slate-800/50 dark:md:hover:bg-transparent dark:md:hover:text-slate-300 dark:md:hover:border-slate-700"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-700 md:text-blue-600 dark:text-blue-400 dark:md:text-blue-500" : "text-slate-500 md:text-slate-400"}`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6 min-h-[300px]">
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Membership Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <SummaryCard label="Area / Branch" value={member.area || "Not specified"} />
              <SummaryCard label="Joined Date" value={formatDate(member.createdAt)} />
              <SummaryCard label="Last Paid" value={member.lastPaidAt ? formatDate(member.lastPaidAt) : "Never"} />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Active Special Events</h3>
              <EmptyState message="Event membership data will be connected in a later phase." />
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <TabSection title="Payment History" message="Payment history will be available after the payment module is connected." />
        )}

        {activeTab === "family" && (
          <TabSection
            title="Family Members"
            message={(member.familyCount ?? 0) > 0
              ? `${member.familyCount} family record${member.familyCount === 1 ? "" : "s"} will be shown when family details are connected.`
              : "No family members added."}
          />
        )}

        {activeTab === "donor" && (
          <div className="animate-in fade-in space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Blood Donor Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-500 mb-1">Blood Group</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center text-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30 shadow-[0_2px_8px_rgba(220,38,38,0.06)] w-fit mt-1">
                  <Droplet className="w-5 h-5 mr-2 fill-red-100 dark:fill-red-900/50 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">{member.bloodGroup || "Not Specified"}</span>
                </div>
              </div>
              <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="text-sm text-slate-500 mb-1">Donor Status</div>
                <div className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                  {member.isBloodDonor ? (
                    member.donorAvailable ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Available to Donate</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Not Available</span>
                    )
                  ) : (
                    <span className="text-slate-400">Not registered as a donor</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <TabSection title="Admin Notes" message="Admin notes have not been connected yet." />
        )}

        {activeTab === "audit" && (
          <TabSection title="Audit Trail" message="Member audit history will be connected in a later phase." />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function TabSection({ title, message }: { title: string; message: string }) {
  return (
    <div className="animate-in fade-in">
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      <EmptyState message={message} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-center py-10">
      {message}
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
