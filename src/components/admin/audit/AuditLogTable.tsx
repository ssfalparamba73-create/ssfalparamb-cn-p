"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronRight, Activity, Edit2, ShieldAlert, PlusCircle, Trash2, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Local type for Audit Log entries in this component
interface AuditLogEntry {
  id: string;
  time: string;
  actor: string;
  action: string;
  entity: string;
  target: string;
  summary: string;
  severity: "info" | "warning" | "error" | "critical";
  ip?: string;
  device?: string;
  changes?: { field: string; before: string; after: string };
}

import type { AuditLogDTO } from "@/lib/backend/dto/admin.dto";
import { BackendApiError } from "@/lib/api/backendClient";
import { getAllAuditLogs } from "@/lib/api/auditClient";
import { useRouter } from "next/navigation";

function actionCategory(action: string): AuditLogEntry["action"] {
  if (action.includes("created") || action.includes("issued")) return "create";
  if (action.includes("updated") || action.includes("reset")) return "update";
  if (action.includes("deleted") || action.includes("removed")) return "delete";
  if (action.includes("failed") || action.includes("lock") || action.includes("security")) return "alert";
  return action;
}

function formatAuditValue(value: unknown): string {
  if (value === undefined || value === null) return "--";
  try {
    return JSON.stringify(value);
  } catch {
    return "Unable to display";
  }
}

function mapAuditLog(log: AuditLogDTO): AuditLogEntry {
  return {
    id: log.id,
    time: new Date(log.createdAt).toLocaleString(),
    actor: log.actorName,
    action: actionCategory(log.action),
    entity: log.entityType,
    target: log.target || log.entityId,
    summary: log.summary,
    severity: log.severity,
    ip: log.ip,
    device: log.device,
    changes: log.before !== undefined || log.after !== undefined
      ? { field: "Recorded data", before: formatAuditValue(log.before), after: formatAuditValue(log.after) }
      : undefined,
  };
}

export function AuditLogTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAllAuditLogs()
      .then((result) => {
        if (active) setLogs(result.map(mapAuditLog));
      })
      .catch((error: unknown) => {
        if (error instanceof BackendApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load audit logs.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const filteredLogs = logs.filter(log => {
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
        <Button disabled variant="outline" title="Audit purge is not enabled" className="flex shrink-0 text-red-600 border-red-200 dark:border-red-900/50 dark:text-red-400">
          <Trash2 className="w-4 h-4 mr-2" /> Purge Old Logs
        </Button>
      </div>

      {isLoading && <div className="p-4 text-sm text-slate-500">Loading audit logs...</div>}
      {loadError && <div className="p-4 text-sm text-red-600 dark:text-red-400">{loadError}</div>}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3">Time</th>
                <th scope="col" className="px-4 py-3">Actor</th>
                <th scope="col" className="px-4 py-3">Action</th>
                <th scope="col" className="px-4 py-3">Entity & Target</th>
                <th scope="col" className="px-4 py-3">Summary</th>
                <th scope="col" className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedLog(log);
                    }
                  }}
                  tabIndex={0}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/50"
                >
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
                    <Button variant="ghost" size="icon" aria-label={`View details for ${log.id}`} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                      <Eye className="w-4 h-4" />
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
          <Card
            key={log.id}
            onClick={() => setSelectedLog(log)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedLog(log);
              }
            }}
            tabIndex={0}
            className="p-4 border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
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
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLog(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getActionIcon(selectedLog.action)}
                <h2 id="drawer-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Audit Detail</h2>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close details" onClick={() => setSelectedLog(null)} className="rounded-full">
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
