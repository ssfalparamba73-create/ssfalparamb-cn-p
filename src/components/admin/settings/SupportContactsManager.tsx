"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Trash2, GripVertical, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { MOCK_CONTACTS } from "@/lib/admin/mock-data";

export function SupportContactsManager() {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Assuming current user is a super admin for this demo
  const isCurrentUserSuperAdmin = true;

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Contact saved successfully");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    toast.error("Contact removed");
  };

  return (
    <div className="space-y-4">
      {MOCK_CONTACTS.map((contact) => (
        <Card key={contact.id} className="p-4 border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          {editingId === contact.id ? (
            // Edit Mode
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input defaultValue={contact.name} className="bg-white dark:bg-slate-950" required />
                </div>
                <div className="space-y-2">
                  <Label>Role (e.g. President, Helpdesk)</Label>
                  <Input defaultValue={contact.role} className="bg-white dark:bg-slate-950" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue={contact.phone} className="bg-white dark:bg-slate-950" required />
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">WhatsApp Available</p>
                    <p className="text-xs text-slate-500">Show WhatsApp action button</p>
                  </div>
                  {/* Mock Toggle */}
                  <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${contact.whatsappEnabled ? 'bg-green-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Status</p>
                    <p className="text-xs text-slate-500">Show this contact to members</p>
                  </div>
                  {/* Mock Toggle */}
                  <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${contact.isActive ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
              </div>
            </form>
          ) : (
            // View Mode
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-3 shrink-0 cursor-move text-slate-400 hover:text-slate-600">
                <GripVertical className="size-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{contact.name}</h3>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 font-normal shadow-none">
                    {contact.role}
                  </Badge>
                  {!contact.isActive && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-800 shadow-none">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{contact.phone}</span>
                  {contact.whatsappEnabled && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">
                      <MessageSquare className="size-3" /> WhatsApp
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(contact.id)} className="flex-1 sm:flex-none text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-900/20">
                  <Edit2 className="size-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Edit</span>
                </Button>
                {isCurrentUserSuperAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)} className="flex-1 sm:flex-none text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-900/20">
                    <Trash2 className="size-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
