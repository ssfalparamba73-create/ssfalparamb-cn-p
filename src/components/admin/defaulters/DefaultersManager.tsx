"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, AlertCircle, Phone, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MOCK_DEFAULTERS } from "@/lib/admin/mock-data";

export function DefaultersManager() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [members, setMembers] = useState(MOCK_DEFAULTERS);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
    let matchesCategory = true;
    if (categoryFilter === "current_due") matchesCategory = m.category === "current_due";
    if (categoryFilter === "long_overdue") matchesCategory = m.category === "long_overdue";
    if (categoryFilter === "needs_followup") matchesCategory = m.reminderCount > 0;
    return matchesSearch && matchesCategory;
  });

  const handleRemind = (id: string, name: string) => {
    toast.success(`Gentle reminder sent to ${name}`);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, reminderCount: m.reminderCount + 1, lastReminded: "Just now" } : m));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
          <Button 
            variant={categoryFilter === "all" ? "default" : "outline"} 
            onClick={() => setCategoryFilter("all")}
            className={cn("rounded-full h-9", categoryFilter === "all" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}
          >
            All Pending
          </Button>
          <Button 
            variant={categoryFilter === "current_due" ? "default" : "outline"} 
            onClick={() => setCategoryFilter("current_due")}
            className={cn("rounded-full h-9", categoryFilter === "current_due" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}
          >
            Current Due
          </Button>
          <Button 
            variant={categoryFilter === "long_overdue" ? "default" : "outline"} 
            onClick={() => setCategoryFilter("long_overdue")}
            className={cn("rounded-full h-9", categoryFilter === "long_overdue" ? "bg-red-500 text-white hover:bg-red-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300")}
          >
            Long Overdue
          </Button>
          <Button 
            variant={categoryFilter === "needs_followup" ? "default" : "outline"} 
            onClick={() => setCategoryFilter("needs_followup")}
            className={cn("rounded-full h-9", categoryFilter === "needs_followup" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white dark:bg-slate-900 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20")}
          >
            Needs Follow-up
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800/30">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Gentle Reminders</p>
          <p className="opacity-90">Please ensure communication is polite and respectful when following up on pending dues.</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Follow-up</th>
                <th className="px-4 py-3">Amount Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => router.push(`/admin/members/${member.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.area}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Phone className="w-3 h-3 mr-1.5" /> {member.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {member.category === 'long_overdue' ? (
                      <Badge variant="destructive" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-50 font-medium shadow-none">
                        Long Overdue
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-50 font-medium shadow-none">
                        Current Due
                      </Badge>
                    )}
                    <div className="text-xs text-slate-500 mt-1">{member.dueMonths} Months (Since {member.lastPaid})</div>
                  </td>
                  <td className="px-4 py-3">
                    {member.reminderCount > 0 ? (
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Reminded {member.lastReminded}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No reminders sent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{member.amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRemind(member.id, member.name); }} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-900/20 shadow-none">
                        <MessageCircle className="w-4 h-4 mr-1.5" /> Remind
                      </Button>
                      <Link href={`/admin/members/${member.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-slate-500">No pending payments found matching your criteria.</div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredMembers.map((member) => (
          <Card 
            key={member.id} 
            onClick={() => router.push(`/admin/members/${member.id}`)}
            className="p-4 border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                  <Phone className="w-3 h-3 mr-1" /> {member.phone}
                </div>
              </div>
              {member.category === 'long_overdue' ? (
                <Badge variant="destructive" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-none">
                  Long Overdue
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-none">
                  Current Due
                </Badge>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{member.dueMonths} Months Pending</div>
                <div className="text-xs text-slate-400">Since {member.lastPaid}</div>
              </div>
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">
                ₹{member.amount}
              </div>
            </div>

            {member.reminderCount > 0 && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Reminded {member.lastReminded}
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-900/20 shadow-none h-9" onClick={(e) => { e.stopPropagation(); handleRemind(member.id, member.name); }}>
                <MessageCircle className="w-4 h-4 mr-2" /> Remind
              </Button>
              <Link href={`/admin/members/${member.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" className="w-full shadow-none h-9">
                  Profile
                </Button>
              </Link>
            </div>
          </Card>
        ))}
        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">No pending payments found.</div>
        )}
      </div>

    </div>
  );
}
