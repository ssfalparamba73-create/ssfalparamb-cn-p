"use client";

import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface AdminMemberFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  bloodGroupFilter: string;
  setBloodGroupFilter: (val: string) => void;
  areaFilter: string;
  setAreaFilter: (val: string) => void;
  tierFilter: string;
  setTierFilter: (val: string) => void;
  arrearsFilter: string;
  setArrearsFilter: (val: string) => void;
}

export function AdminMemberFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  bloodGroupFilter,
  setBloodGroupFilter,
  areaFilter,
  setAreaFilter,
  tierFilter,
  setTierFilter,
  arrearsFilter,
  setArrearsFilter,
}: AdminMemberFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search members by name, phone, or ID..." 
          className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <div className="relative min-w-[140px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[140px]">
          <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Blood Group (All)</SelectItem>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0 h-10 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">Advanced Filters</h4>
              
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Area / Branch</Label>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="Alparamba Center">Alparamba Center</SelectItem>
                    <SelectItem value="North Gate">North Gate</SelectItem>
                    <SelectItem value="South Block">South Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Monthly Tier</Label>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="base">Base (₹50)</SelectItem>
                    <SelectItem value="premium">Premium (₹100)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Payment Status</Label>
                <Select value={arrearsFilter} onValueChange={setArrearsFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="arrears">Pending Dues (Arrears)</SelectItem>
                    <SelectItem value="clear">Clear (No Dues)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-8"
                  onClick={() => {
                    setAreaFilter("all");
                    setTierFilter("all");
                    setArrearsFilter("all");
                    setStatusFilter("all");
                    setBloodGroupFilter("all");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
