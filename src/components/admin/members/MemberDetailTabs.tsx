"use client";

import React, { useState } from "react";
import { Member } from "@/lib/admin/admin-types";
import { 
  CreditCard, 
  Users, 
  Droplet, 
  FileText, 
  History,
  Activity,
  MessageCircle
} from "lucide-react";

interface MemberDetailTabsProps {
  member: Member;
}

export function MemberDetailTabs({ member }: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "family", label: "Family", icon: Users },
    { id: "donor", label: "Blood Donor", icon: Droplet },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "audit", label: "Audit", icon: History },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <nav className="grid grid-cols-2 md:flex md:items-center p-2 md:p-0 md:px-4 gap-2 md:gap-0" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-3 md:py-4 px-3 md:px-4 md:border-b-2 rounded-lg md:rounded-none font-medium text-sm flex items-center justify-center md:justify-start gap-2 transition-colors
                ${activeTab === tab.id
                  ? "bg-blue-50 md:bg-transparent md:border-blue-600 text-blue-700 md:text-blue-600 dark:bg-blue-900/20 dark:md:bg-transparent dark:md:border-blue-500 dark:text-blue-400"
                  : "md:border-transparent text-slate-600 md:text-slate-500 hover:bg-slate-50 md:hover:bg-transparent md:hover:text-slate-700 md:hover:border-slate-300 dark:text-slate-300 dark:md:text-slate-400 dark:hover:bg-slate-800/50 dark:md:hover:bg-transparent dark:md:hover:text-slate-300 dark:md:hover:border-slate-700"
                }
              `}
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
                <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Area / Branch</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{member.area}</div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Joined Date</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(member.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Last Paid</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {member.lastPaidAt ? new Date(member.lastPaidAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                  </div>
                </div>
             </div>

             {/* Active Special Events */}
             <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Active Special Events</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                 <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-semibold text-slate-900 dark:text-slate-100">Rabeeyul Awwal Special</span>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Pending</span>
                   </div>
                   <div className="text-sm text-slate-600 dark:text-slate-400">Minimum: ₹100</div>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="animate-in fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
               <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Payment History</h3>
               <button 
                 onClick={() => {
                   const message = `Hello ${member.name}, this is a gentle reminder from SSF Alparamba that your monthly dues of ₹${member.monthlyAmount} are pending. Please clear them at your earliest convenience.`;
                   window.open(`https://wa.me/91${member.phone}?text=${encodeURIComponent(message)}`, '_blank');
                 }}
                 className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-900/50 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 w-full sm:w-auto"
               >
                 <MessageCircle className="w-4 h-4 mr-2" />
                 Send Reminder via WhatsApp
               </button>
             </div>
             {/* Desktop Table View */}
             <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Receipt & Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">REC-2026-07-001</div>
                        <div className="text-xs text-slate-500">04 Jul 2026</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Monthly Dues</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">₹100</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Confirmed</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">REC-2026-06-045</div>
                        <div className="text-xs text-slate-500">02 Jun 2026</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Building Fund</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">₹500</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Confirmed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
             </div>

             {/* Mobile Cards View */}
             <div className="grid gap-3 md:hidden">
               <div className="p-3 md:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">₹100</div>
                     <div className="text-xs text-slate-500">REC-2026-07-001 • 04 Jul 2026</div>
                   </div>
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Confirmed</span>
                 </div>
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Dues</div>
                 </div>
               </div>
               <div className="p-3 md:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">₹500</div>
                     <div className="text-xs text-slate-500">REC-2026-06-045 • 02 Jun 2026</div>
                   </div>
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Confirmed</span>
                 </div>
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Building Fund</div>
                 </div>
               </div>
             </div>
             <div className="mt-4 text-center">
               <a href="/admin/payments" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                 View Full Ledger &rarr;
               </a>
             </div>
          </div>
        )}

        {activeTab === "family" && (
           <div className="animate-in fade-in">
             <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Family Members</h3>
             <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-center py-10">
               No family members added.
             </div>
           </div>
        )}

        {activeTab === "donor" && (
           <div className="animate-in fade-in space-y-4">
             <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Blood Donor Profile</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Blood Group</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center text-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30 shadow-[0_2px_8px_rgba(220,38,38,0.06)] w-fit mt-1">
                    <Droplet className="w-5 h-5 mr-2 fill-red-100 dark:fill-red-900/50 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">{member.bloodGroup || 'Not Specified'}</span>
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-sm text-slate-500 mb-1">Donor Status</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                    {member.isBloodDonor ? (
                      member.donorAvailable ? 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Available to Donate</span> 
                        : 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Not Available</span>
                    ) : (
                      <span className="text-slate-400">Not registered as a donor</span>
                    )}
                  </div>
                </div>
             </div>
           </div>
        )}
        
        {activeTab === "notes" && (
           <div className="animate-in fade-in">
             <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Admin Notes</h3>
             <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[100px]">
               No internal notes recorded for this member.
             </div>
           </div>
        )}
        
        {activeTab === "audit" && (
           <div className="animate-in fade-in">
             <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Audit Trail</h3>
             <div className="space-y-4">
                 <div className="text-sm bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                   <div className="flex justify-between mb-1">
                     <span className="font-medium text-slate-900 dark:text-slate-100">Member Record Created</span>
                     <span className="text-slate-500">{new Date(member.createdAt).toLocaleString()}</span>
                   </div>
                   <div className="text-slate-500">System initialization</div>
                 </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
