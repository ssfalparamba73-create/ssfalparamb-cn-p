"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMemberFilters } from "@/components/admin/members/AdminMemberFilters";
import { AdminMemberRow } from "@/components/admin/members/AdminMemberRow";
import { AdminMemberCard } from "@/components/admin/members/AdminMemberCard";
import { MOCK_MEMBERS } from "@/lib/admin/mock-data";
import Link from "next/link";
import { adminClient } from "@/lib/frontend-api/adminClient";
import { toast } from "sonner";
import { MemberDTO } from "@/lib/backend/dto/member.dto";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  
  // New Filters
  const [areaFilter, setAreaFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [arrearsFilter, setArrearsFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  React.useEffect(() => {
    async function load() {
      try {
        const res = await adminClient.listMembers({ pageSize: "1000" });
        setMembers(res.items.map(m => ({
          id: m.id,
          memberId: m.memberCode,
          name: m.name,
          phone: m.phone,
          bloodGroup: m.bloodGroup || "",
          isBloodDonor: m.isBloodDonor,
          donorAvailable: m.donorAvailable,
          area: m.area || "",
          status: m.status,
          monthlyTier: m.monthlyTier,
          monthlyAmount: m.monthlyAmount,
          pinStatus: m.pinStatus,
          lastPaidAt: m.lastPaidAt || "",
          duesPending: m.duesPending,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })));
      } catch (err: any) {
        toast.error(err.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredMembers = members.filter((member) => {
    // Search query filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      member.name.toLowerCase().includes(searchLower) ||
      member.phone.includes(searchQuery) ||
      member.memberId.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;

    // Blood Group filter
    const matchesBloodGroup = bloodGroupFilter === "all" || member.bloodGroup === bloodGroupFilter;

    // Area filter
    const matchesArea = areaFilter === "all" || member.area === areaFilter;

    // Tier filter
    const matchesTier = tierFilter === "all" || member.monthlyTier === tierFilter;

    // Arrears filter
    const matchesArrears = arrearsFilter === "all" || (arrearsFilter === "arrears" ? member.duesPending > 0 : member.duesPending === 0);

    return matchesSearch && matchesStatus && matchesBloodGroup && matchesArea && matchesTier && matchesArrears;
  }).sort((a, b) => {
    if (sortOption === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOption === "name-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortOption === "name-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortOption === "dues-desc") {
      return b.duesPending - a.duesPending;
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-50">Members</h2>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Manage directory, profiles, and dues.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/members/new" className="w-full sm:w-auto">
            <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <AdminMemberFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          bloodGroupFilter={bloodGroupFilter}
          setBloodGroupFilter={setBloodGroupFilter}
          areaFilter={areaFilter}
          setAreaFilter={setAreaFilter}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          arrearsFilter={arrearsFilter}
          setArrearsFilter={setArrearsFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
        <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider sm:pl-6">Member</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blood</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dues</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredMembers.map((member) => (
                <AdminMemberRow key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredMembers.map((member) => (
                <AdminMemberCard key={member.id} member={member} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
