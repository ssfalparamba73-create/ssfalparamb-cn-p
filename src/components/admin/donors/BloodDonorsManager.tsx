"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Droplets, Phone, Edit2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MemberDTO } from "@/lib/backend/dto/member.dto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getAllAdminBloodDonors, updateAdminMember } from "@/lib/api/memberClient";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

interface BloodDonorView {
  id: string;
  name: string;
  phone: string;
  bloodGroup?: MemberDTO["bloodGroup"];
  area?: string;
  isAvailable: boolean;
}

function mapDonor(member: MemberDTO): BloodDonorView {
  return {
    id: member.id,
    name: member.name,
    phone: member.phone,
    bloodGroup: member.bloodGroup,
    area: member.area,
    isAvailable: member.donorAvailable,
  };
}

function csvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function BloodDonorsManager() {
  const router = useRouter();
  const [donors, setDonors] = useState<BloodDonorView[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAllAdminBloodDonors()
      .then((result) => {
        if (!active) return;
        setDonors(result.map(mapDonor));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof BackendApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unable to load blood donors.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) || donor.phone.includes(searchQuery);
    const matchesGroup = groupFilter === "all" || donor.bloodGroup === groupFilter;
    const matchesAvailability = availabilityFilter === "all" || (availabilityFilter === "available" ? donor.isAvailable : !donor.isAvailable);

    return matchesSearch && matchesGroup && matchesAvailability;
  });

  const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setTogglingId(id);
    try {
      const updated = await updateAdminMember(id, { donorAvailable: newStatus });
      setDonors((current) => current.map((donor) => donor.id === id ? mapDonor(updated) : donor));
      toast.success(`${name}'s availability changed to ${newStatus ? "Available" : "Unavailable"}`);
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Unable to update donor availability.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleExport = () => {
    const rows = [
      ["Name", "Phone", "Blood Group", "Area", "Availability"],
      ...filteredDonors.map((donor) => [
        donor.name,
        donor.phone,
        donor.bloodGroup ?? "",
        donor.area ?? "",
        donor.isAvailable ? "Available" : "Unavailable",
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blood-donors.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search donors..."
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[140px]">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {BLOOD_GROUPS.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative min-w-[160px]">
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donors</SelectItem>
              <SelectItem value="available">Available Now</SelectItem>
              <SelectItem value="unavailable">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} disabled={filteredDonors.length === 0} variant="outline" className="hidden sm:flex bg-white dark:bg-slate-800 shrink-0">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {isLoading && <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading blood donors...</p>}
      {loadError && <p className="p-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Last Donated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDonors.map((donor) => (
                <tr key={donor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{donor.name}</div>
                    <div className="text-xs text-slate-500">{donor.area}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Phone className="w-3 h-3 mr-1.5" /> {donor.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30">
                      {donor.bloodGroup ?? "--"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    Not recorded
                  </td>
                  <td className="px-4 py-3">
                    {donor.isAvailable ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 shadow-none">Available</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-800 shadow-none">Unavailable</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(donor.id, donor.name, donor.isAvailable)}
                      disabled={togglingId === donor.id}
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 className="w-4 h-4 mr-1.5" /> {togglingId === donor.id ? "Saving..." : "Toggle"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !loadError && filteredDonors.length === 0 && (
            <div className="p-8 text-center text-slate-500">No blood donors found for this criteria.</div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredDonors.map((donor) => (
          <Card key={donor.id} className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{donor.name}</h3>
                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                  <Phone className="w-3 h-3 mr-1" /> {donor.phone}
                </div>
              </div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold text-lg border border-red-100 dark:border-red-900/30">
                {donor.bloodGroup ?? "--"}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded mb-3">
              <div className="text-xs text-slate-500">
                Last donated: Not recorded
              </div>
              {donor.isAvailable ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 shadow-none">Available</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-800 shadow-none">Unavailable</Badge>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => handleToggleStatus(donor.id, donor.name, donor.isAvailable)}
              disabled={togglingId === donor.id}
              className="w-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-900/20"
            >
              <Droplets className="w-4 h-4 mr-2" /> {togglingId === donor.id ? "Saving..." : "Change Status"}
            </Button>
          </Card>
        ))}
        {!isLoading && !loadError && filteredDonors.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">No donors found.</div>
        )}
      </div>

    </div>
  );
}
