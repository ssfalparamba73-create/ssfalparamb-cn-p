"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, Activity, Edit2, ShieldAlert, PlusCircle, Trash2, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock Data
const MOCK_AUDIT = [
  { id: "LOG-001", time: "2026-07-08 10:30 AM", actor: "Farhan M", action: "update", entity: "Member", target: "Safwan", summary: "Updated phone number", severity: "info", ip: "192.168.1.42", device: "Chrome / Windows 11", changes: { field: "Phone Number", before: "+919876543210", after: "9876543210" } },
  { id: "LOG-002", time: "2026-07-08 11:15 AM", actor: "Shibili N", action: "create", entity: "Payment", target: "Cash Receipt REC-0012", summary: "Recorded cash handover", severity: "info", ip: "192.168.1.15", device: "Safari / iPhone 14", changes: { field: "Status", before: "Pending", after: "Confirmed" } },
  { id: "LOG-003", time: "2026-07-07 04:20 PM", actor: "Farhan M", action: "delete", entity: "Support Contact", target: "Fawas", summary: "Removed support contact", severity: "warning", ip: "192.168.1.42", device: "Chrome / Windows 11", changes: { field: "Access", before: "Granted", after: "Revoked" } },
  { id: "LOG-004", time: "2026-07-06 09:10 AM", actor: "System", action: "alert", entity: "Security", target: "Admin Login", summary: "Multiple failed login attempts", severity: "error", ip: "45.22.19.102", device: "Unknown Device", changes: { field: "IP Address", before: "Unknown", after: "Blocked" } },
];

export function AuditLogTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);

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
                <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
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
          <Card key={log.id} onClick={() => setSelectedLog(log)} className="p-4 border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer">
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

            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded flex justify-between items-center">
              <span>{log.summary}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        ))}
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">No logs found.</div>
        )}
      </div>

      {/* Drawer */}
      {selectedLog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLog(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getActionIcon(selectedLog.action)}
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Audit Detail</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Metadata</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Log ID</span>
                    <span className="text-sm font-mono font-medium">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Timestamp</span>
                    <span className="text-sm font-medium">{selectedLog.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Actor</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{selectedLog.actor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">IP Address</span>
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{selectedLog.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Device</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{selectedLog.device}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Action Context</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedLog.entity}</Badge>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedLog.target}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-900/50">
                    {selectedLog.summary}
                  </p>
                </div>
              </div>

              {selectedLog.changes && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Before / After Data</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Modified Field: {selectedLog.changes.field}
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
                      <div className="p-4 space-y-1 bg-red-50/30 dark:bg-red-900/5">
                        <p className="text-[10px] uppercase font-bold text-red-500">Before</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-words">{selectedLog.changes.before}</p>
                      </div>
                      <div className="p-4 space-y-1 bg-green-50/30 dark:bg-green-900/5">
                        <p className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500">After</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-words">{selectedLog.changes.after}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <Button className="w-full" variant="outline" onClick={() => setSelectedLog(null)}>Close Details</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

