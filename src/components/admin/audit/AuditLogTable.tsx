"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, Activity, Edit2, ShieldAlert, PlusCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock Data
const MOCK_AUDIT = [
  { id: "LOG-001", time: "2026-07-08 10:30 AM", actor: "Farhan M", action: "update", entity: "Member", target: "Safwan", summary: "Updated phone number", severity: "info" },
  { id: "LOG-002", time: "2026-07-08 11:15 AM", actor: "Shibili N", action: "create", entity: "Payment", target: "Cash Receipt REC-0012", summary: "Recorded cash handover", severity: "info" },
  { id: "LOG-003", time: "2026-07-07 04:20 PM", actor: "Farhan M", action: "delete", entity: "Support Contact", target: "Fawas", summary: "Removed support contact", severity: "warning" },
  { id: "LOG-004", time: "2026-07-06 09:10 AM", actor: "System", action: "alert", entity: "Security", target: "Admin Login", summary: "Multiple failed login attempts", severity: "error" },
];

export function AuditLogTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Assuming current user is a super admin for this demo
  const isCurrentUserSuperAdmin = true;

  const filteredLogs = MOCK_AUDIT.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <PlusCircle className="w-4 h-4 text-green-500" />;
      case 'update': return <Edit2 className="w-4 h-4 text-blue-500" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-amber-500" />;
      case 'alert': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search actor, target, or summary..." 
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[160px]">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Created (Add)</SelectItem>
              <SelectItem value="update">Updated (Edit)</SelectItem>
              <SelectItem value="delete">Deleted (Remove)</SelectItem>
              <SelectItem value="alert">Security / Alerts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isCurrentUserSuperAdmin && (
          <Button variant="outline" className="flex shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:text-red-400">
            <Trash2 className="w-4 h-4 mr-2" /> Purge Old Logs
          </Button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity & Target</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs font-mono">
                    {log.time}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {log.actor}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="capitalize">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 mr-2 shadow-none">{log.entity}</Badge>
                    <span className="text-slate-600 dark:text-slate-300">{log.target}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {log.summary}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500">No logs found matching your criteria.</div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {getActionIcon(log.action)}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{log.actor}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
            </div>
            
            <div className="mb-2">
              <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 shadow-none mb-1">{log.entity}</Badge>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.target}</div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
              {log.summary}
            </div>
          </Card>
        ))}
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">No logs found.</div>
        )}
      </div>
    </div>
  );
}
