"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Edit2, Trash2, Plus, AlertCircle, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";
import type { AdminMemberCandidateDTO, AdminRole, AdminUserDTO, IssuedAdminCodeDTO } from "@/lib/backend/dto/admin.dto";
import {
  deactivateAdminUser,
  getAdminUsers,
  promoteMemberToAdmin,
  resetAdminUserCode,
  searchAdminCandidates,
  updateAdminUserAccess,
} from "@/lib/api/adminUserClient";
import { MemberInvitationDialog } from "@/components/admin/members/MemberInvitationDialog";

export function AdminUsersManager() {
  const [admins, setAdmins] = useState<AdminUserDTO[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<AdminMemberCandidateDTO[]>([]);
  const [selected, setSelected] = useState<AdminMemberCandidateDTO | null>(null);
  const [role, setRole] = useState<AdminRole>("viewer");
  const [status, setStatus] = useState<AdminUserDTO["status"]>("active");
  const [issued, setIssued] = useState<IssuedAdminCodeDTO | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try { setAdmins((await getAdminUsers()).items); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load admin users."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  useEffect(() => {
    if (!isAdding || selected || search.trim().length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      searchAdminCandidates(search.trim())
        .then((result) => { if (active) setCandidates(result); })
        .catch((searchError) => { if (active) toast.error(searchError instanceof Error ? searchError.message : "Unable to search members."); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isAdding, search, selected]);

  const resetForm = () => {
    setIsAdding(false); setEditingId(null); setSearch(""); setSelected(null); setCandidates([]); setRole("viewer"); setStatus("active");
  };

  const saveNew = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) { toast.error("Select an existing active member first."); return; }
    setIsSaving(true);
    try {
      const result = await promoteMemberToAdmin({ memberId: selected.id, role, status });
      setIssued(result);
      toast.success("Admin access created successfully.");
      resetForm();
      await load();
    } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : "Unable to create admin access."); }
    finally { setIsSaving(false); }
  };

  const saveExisting = async (event: React.FormEvent, admin: AdminUserDTO) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateAdminUserAccess(admin.id, { role, status });
      toast.success("Admin access updated successfully.");
      resetForm();
      await load();
    } catch (saveError) { toast.error(saveError instanceof Error ? saveError.message : "Unable to update admin access."); }
    finally { setIsSaving(false); }
  };

  const deactivate = async (admin: AdminUserDTO) => {
    if (!window.confirm(`Deactivate ${admin.name}'s admin access? Their member record will not be changed.`)) return;
    try { await deactivateAdminUser(admin.id); toast.success("Admin access deactivated."); await load(); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : "Unable to deactivate admin access."); }
  };

  const resetCode = async (admin: AdminUserDTO) => {
    if (!window.confirm(`Generate a new admin login code for ${admin.name}? Existing admin sessions will be logged out.`)) return;
    try { setIssued(await resetAdminUserCode(admin.id)); }
    catch (resetError) { toast.error(resetError instanceof Error ? resetError.message : "Unable to reset admin code."); }
  };

  const roleSelect = () => (
    <Select value={role} onValueChange={(value) => setRole(value as AdminRole)}>
      <SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="viewer">Viewer (Read Only)</SelectItem><SelectItem value="collector">Collector</SelectItem><SelectItem value="treasurer">Treasurer</SelectItem><SelectItem value="secretary">Secretary</SelectItem><SelectItem value="president">President</SelectItem><SelectItem value="super_admin">Super Admin (Max 2)</SelectItem></SelectContent>
    </Select>
  );

  const editForm = (admin: AdminUserDTO) => (
    <form onSubmit={(event) => void saveExisting(event, admin)} className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Full Name</Label><Input value={admin.name} readOnly className="bg-white dark:bg-slate-950" /></div>
        <div className="space-y-2"><Label>Phone Number (Login ID)</Label><Input value={admin.phone} readOnly className="bg-white dark:bg-slate-950" /></div>
        <div className="space-y-2"><Label>Role</Label>{roleSelect()}</div>
        <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as AdminUserDTO["status"])}><SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-blue-600 text-white">{isSaving ? "Saving..." : "Save Admin"}</Button></div>
    </form>
  );

  return (
    <div className="space-y-6">
      {error && <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex gap-3"><AlertCircle className="w-5 h-5" /><div><p className="font-semibold">Admin users unavailable</p><p className="text-sm">{error}</p></div></div>}
      {!isAdding && !editingId && !error && <Button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Add New Admin</Button>}

      {isAdding && (
        <form onSubmit={(event) => void saveNew(event)} className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div className="space-y-2"><Label>Search Existing Member</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); setCandidates([]); }} placeholder="Type member name, phone, or member ID" className="pl-9 bg-white dark:bg-slate-950" /></div>
            {!selected && candidates.length > 0 && <div className="rounded-lg border bg-white dark:bg-slate-950 overflow-hidden">{candidates.map((candidate) => <button type="button" key={candidate.id} onClick={() => { setSelected(candidate); setSearch(candidate.name); setCandidates([]); }} className="block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="font-medium">{candidate.name}</span><span className="ml-2 text-xs text-slate-500">{candidate.memberCode} · {candidate.phone}</span></button>)}</div>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={selected?.name ?? ""} readOnly placeholder="Select a member above" className="bg-white dark:bg-slate-950" /></div>
            <div className="space-y-2"><Label>Phone Number (Login ID)</Label><Input value={selected?.phone ?? ""} readOnly placeholder="Select a member above" className="bg-white dark:bg-slate-950" /></div>
            <div className="space-y-2"><Label>Role</Label>{roleSelect()}</div>
            <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as AdminUserDTO["status"])}><SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button><Button type="submit" disabled={isSaving || !selected} className="bg-blue-600 text-white">{isSaving ? "Saving..." : "Save Admin"}</Button></div>
        </form>
      )}

      {isLoading && <p className="text-sm text-slate-500">Loading admin users...</p>}
      {!isLoading && !error && admins.length === 0 && <Card className="p-6 text-center text-sm text-slate-500">No admin users are available.</Card>}
      <div className="grid grid-cols-1 gap-4">
        {admins.map((admin) => {
          const adminRole = admin.roles[0] ?? "viewer";
          return <Card key={admin.id} className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm ${adminRole === "super_admin" ? "border-purple-200 bg-purple-50/30 dark:bg-purple-900/10" : "bg-white dark:bg-slate-900"}`}>
            {editingId === admin.id ? editForm(admin) : <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${adminRole === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{admin.avatarInitials}</div>
              <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="font-bold truncate">{admin.name}</h3>{adminRole === "super_admin" ? <Badge variant="outline" className="text-purple-700"><ShieldCheck className="w-3 h-3 mr-1" /> Super Admin</Badge> : <Badge variant="outline" className="capitalize">{adminRole}</Badge>}{admin.status === "inactive" && <Badge variant="secondary">Inactive</Badge>}</div><span className="text-sm text-slate-600 dark:text-slate-300">{admin.phone}</span></div>
              <div className="flex items-center gap-2 w-full sm:w-auto border-t pt-2 sm:border-0 sm:pt-0"><Button variant="ghost" size="sm" disabled={admin.status !== "active"} onClick={() => void resetCode(admin)} title="Reset login code"><KeyRound className="size-4" /></Button><Button variant="ghost" size="sm" onClick={() => { setEditingId(admin.id); setRole(adminRole); setStatus(admin.status); setIsAdding(false); }}><Edit2 className="size-4" /><span className="sm:hidden ml-2">Edit</span></Button><Button variant="ghost" size="sm" disabled={admin.status === "inactive"} onClick={() => void deactivate(admin)} className="text-red-600"><Trash2 className="size-4" /><span className="sm:hidden ml-2">Remove</span></Button></div>
            </div>}
          </Card>;
        })}
      </div>

      {issued && <MemberInvitationDialog memberName={issued.admin.name} phone={issued.admin.phone} pin={issued.code} message={`SSF Alparamba admin login: Phone ${issued.admin.phone}, Code ${issued.code}`} title="Admin login invitation ready" description="Share this admin login code now. It is shown only once." onClose={() => setIssued(null)} />}
    </div>
  );
}
