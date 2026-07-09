"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, AlertCircle, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock Data
const MOCK_PENDING = [
  { id: "1", name: "Fawas", phone: "9876543210", area: "Alparamba Center", dueMonths: 4, amount: 200, category: "long_overdue", lastPaid: "Feb 2026" },
  { id: "2", name: "Safwan", phone: "8765432109", area: "North Zone", dueMonths: 1, amount: 50, category: "current_due", lastPaid: "May 2026" },
  { id: "3", name: "Shibili N", phone: "7654321098", area: "South Zone", dueMonths: 6, amount: 300, category: "long_overdue", lastPaid: "Dec 2025" },
];

export function DefaultersManager() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredMembers = MOCK_PENDING.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRemind = (name: string, phone: string, months: number) => {
    toast.success(`Gentle reminder sent to ${name}`);
    // In a real app, this might open a WhatsApp URL
    // window.open(`https://wa.me/91${phone}?text=...`)
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or phone..." 
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[160px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Pending" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pending</SelectItem>
              <SelectItem value="current_due">Current Due (നിലവിൽ ബാക്കിയുള്ളവർ)</SelectItem>
              <SelectItem value="long_overdue">Long Overdue (കൂടുതൽ കാലമായി ബാക്കിയുള്ളവർ)</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pending Months</th>
                <th className="px-4 py-3 text-right">Amount Due</th>
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
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-slate-100 font-medium">{member.dueMonths} Months</div>
                    <div className="text-xs text-slate-500">Since {member.lastPaid}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                    ₹{member.amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRemind(member.name, member.phone, member.dueMonths); }} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-900/20">
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
      <div className="md:hidden space-y-3">
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
            
            <div className="flex justify-between items-end mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <div className="text-xs text-slate-500 mb-0.5">{member.dueMonths} Months Pending</div>
                <div className="text-[10px] text-slate-400">Since {member.lastPaid}</div>
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                ₹{member.amount}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-900/20" onClick={(e) => { e.stopPropagation(); handleRemind(member.name, member.phone, member.dueMonths); }}>
                <MessageCircle className="w-4 h-4 mr-2" /> Remind
              </Button>
              <Link href={`/admin/members/${member.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" className="w-full">
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
