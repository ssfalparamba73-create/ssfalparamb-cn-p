"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Edit2, Trash2, Plus, UserCog, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { MOCK_ADMIN_USERS } from "@/lib/admin/mock-data";
import { AdminUser } from "@/lib/admin/admin-types";



export function AdminUsersManager() {
  const [admins, setAdmins] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Assuming current user is a super admin for this demo
  const isCurrentUserSuperAdmin = true; 

  const superAdminCount = admins.filter(a => a.role === "super_admin").length;

  const handleSave = (e: React.FormEvent, id: string | null) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const role = formData.get("role") as AdminRole;
    
    if (role === "super_admin" && superAdminCount >= 2 && (!id || admins.find(a => a.id === id)?.role !== "super_admin")) {
      toast.error("Maximum of 2 Super Admins allowed at a time.");
      return;
    }

    if (id) {
      // Editing existing
      const existingAdmin = admins.find(a => a.id === id);
      if (existingAdmin?.role === "super_admin" && role !== "super_admin" && superAdminCount <= 1) {
        toast.error("Cannot change role. At least one Super Admin must exist.");
        return;
      }
      toast.success("Admin updated successfully");
      setEditingId(null);
    } else {
      // Adding new
      toast.success("New admin added successfully");
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    const adminToDelete = admins.find(a => a.id === id);
    if (adminToDelete?.role === "super_admin" && superAdminCount <= 1) {
      toast.error("Cannot delete the last Super Admin.");
      return;
    }
    toast.error("Admin user removed");
  };

  const renderForm = (admin?: AdminUser) => (
    <form onSubmit={(e) => handleSave(e, admin?.id || null)} className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input name="name" defaultValue={admin?.name} className="bg-white dark:bg-slate-950" required />
        </div>
        <div className="space-y-2">
          <Label>Phone Number (Login ID)</Label>
          <Input name="phone" defaultValue={admin?.phone} className="bg-white dark:bg-slate-950" required />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select name="role" defaultValue={admin?.role || "viewer"}>
            <SelectTrigger className="bg-white dark:bg-slate-950">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
              <SelectItem value="collector">Collector</SelectItem>
              <SelectItem value="treasurer">Treasurer</SelectItem>
              <SelectItem value="secretary">Secretary</SelectItem>
              <SelectItem value="president">President</SelectItem>
              <SelectItem value="super_admin" disabled={superAdminCount >= 2 && admin?.role !== "super_admin"}>
                Super Admin (Max 2)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" defaultValue={admin?.status !== "inactive" ? "active" : "inactive"}>
            <SelectTrigger className="bg-white dark:bg-slate-950">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Admin</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {!isCurrentUserSuperAdmin && (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-start gap-3 border border-amber-100 dark:border-amber-800/30">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">View Only</p>
            <p className="opacity-90">Only Super Admins can add, edit, or delete other admin users.</p>
          </div>
        </div>
      )}

      {isCurrentUserSuperAdmin && !isAdding && (
        <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add New Admin
        </Button>
      )}

      {isAdding && renderForm()}

      <div className="grid grid-cols-1 gap-4">
        {admins.map((admin) => (
          <Card key={admin.id} className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm transition-colors ${admin.role === 'super_admin' ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-900/10' : 'bg-white dark:bg-slate-900'}`}>
            {editingId === admin.id ? (
              renderForm(admin)
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  admin.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {admin.name.substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{admin.name}</h3>
                    {admin.role === 'super_admin' && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 shadow-none">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin
                      </Badge>
                    )}
                    {admin.role !== 'super_admin' && (
                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 font-normal shadow-none capitalize">
                        {admin.role}
                      </Badge>
                    )}
                    {admin.status === "inactive" && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-800 shadow-none">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{admin.phone}</span>
                  </div>
                </div>

                {isCurrentUserSuperAdmin && (
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 dark:border-slate-800">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(admin.id)} className="flex-1 sm:flex-none text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-900/20">
                      <Edit2 className="size-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(admin.id)} className="flex-1 sm:flex-none text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-900/20">
                      <Trash2 className="size-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Remove</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
