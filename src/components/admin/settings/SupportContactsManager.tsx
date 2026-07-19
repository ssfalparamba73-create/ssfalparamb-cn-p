"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Edit2, GripVertical, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SupportContactDTO } from "@/lib/backend/dto/support.dto";
import {
  archiveAdminSupportContact,
  createAdminSupportContact,
  getAdminSupportContacts,
  reorderAdminSupportContacts,
  updateAdminSupportContact,
} from "@/lib/api/supportClient";

interface ContactFormState {
  name: string;
  role: string;
  phone: string;
  email: string;
  whatsappEnabled: boolean;
  isPrimary: boolean;
  isActive: boolean;
}

const emptyForm: ContactFormState = {
  name: "",
  role: "",
  phone: "",
  email: "",
  whatsappEnabled: true,
  isPrimary: false,
  isActive: true,
};

function toForm(contact?: SupportContactDTO): ContactFormState {
  return contact ? {
    name: contact.name,
    role: contact.role ?? "",
    phone: contact.phone,
    email: contact.email ?? "",
    whatsappEnabled: contact.whatsappEnabled,
    isPrimary: contact.isPrimary,
    isActive: contact.isActive,
  } : emptyForm;
}

export function SupportContactsManager() {
  const [contacts, setContacts] = useState<SupportContactDTO[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setContacts(await getAdminSupportContacts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load support contacts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  const beginEdit = (contact: SupportContactDTO) => {
    setEditingId(contact.id);
    setIsAdding(false);
    setForm(toForm(contact));
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = {
        name: form.name,
        role: form.role,
        phone: form.phone,
        email: form.email || undefined,
        whatsappEnabled: form.whatsappEnabled,
        isPrimary: form.isPrimary,
        isActive: form.isActive,
      };
      if (editingId) await updateAdminSupportContact(editingId, input);
      else await createAdminSupportContact(input);
      toast.success(editingId ? "Contact saved successfully." : "Contact added successfully.");
      cancelForm();
      await load();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save contact.");
    } finally {
      setIsSaving(false);
    }
  };

  const archive = async (contact: SupportContactDTO) => {
    if (!window.confirm(`Remove ${contact.name} from support contacts? This is a soft archive.`)) return;
    try {
      await archiveAdminSupportContact(contact.id);
      toast.success("Contact archived successfully.");
      await load();
    } catch (archiveError) {
      toast.error(archiveError instanceof Error ? archiveError.message : "Unable to archive contact.");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= contacts.length) return;
    const reordered = [...contacts];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setContacts(reordered);
    try {
      await reorderAdminSupportContacts(reordered.map((contact) => contact.id));
      toast.success("Contact order saved.");
    } catch (reorderError) {
      toast.error(reorderError instanceof Error ? reorderError.message : "Unable to reorder contacts.");
      await load();
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Role (e.g. President, Helpdesk)</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })} required /></div>
        <div className="space-y-2"><Label>Email (Optional)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        {([
          ["whatsappEnabled", "WhatsApp Available", "Show WhatsApp action button"],
          ["isPrimary", "Primary Contact", "Use as the first support contact"],
          ["isActive", "Active Status", "Show this contact to members"],
        ] as const).map(([key, title, help]) => (
          <label key={key} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
            <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-slate-500">{help}</span></span>
            <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="h-4 w-4" />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={cancelForm}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-blue-600 text-white">{isSaving ? "Saving..." : "Save Changes"}</Button></div>
    </form>
  );

  return (
    <div className="space-y-4">
      {!isAdding && !editingId && <Button onClick={() => { setIsAdding(true); setForm(emptyForm); }} className="bg-blue-600 text-white"><Plus className="mr-2 h-4 w-4" /> Add Support Contact</Button>}
      {isAdding && renderForm()}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} <Button variant="link" onClick={() => void load()}>Retry</Button></div>}
      {isLoading && <p className="text-sm text-slate-500">Loading support contacts...</p>}
      {!isLoading && !error && contacts.length === 0 && <Card className="p-6 text-center text-sm text-slate-500">No support contacts have been added yet.</Card>}
      {contacts.map((contact, index) => (
        <Card key={contact.id} className="p-4 border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {editingId === contact.id ? renderForm() : (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <GripVertical className="size-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="font-bold">{contact.name}</h3><Badge variant="outline">{contact.role}</Badge>{contact.isPrimary && <Badge variant="outline">Primary</Badge>}{!contact.isActive && <Badge variant="secondary">Inactive</Badge>}</div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500"><span className="font-medium text-slate-700 dark:text-slate-300">{contact.phone}</span>{contact.whatsappEnabled && <span className="flex items-center gap-1 text-green-600 text-xs"><MessageSquare className="size-3" /> WhatsApp</span>}</div>
              </div>
              <div className="flex items-center gap-1 w-full sm:w-auto border-t pt-2 sm:border-0 sm:pt-0">
                <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => void move(index, -1)} title="Move up"><ArrowUp className="size-4" /></Button>
                <Button variant="ghost" size="sm" disabled={index === contacts.length - 1} onClick={() => void move(index, 1)} title="Move down"><ArrowDown className="size-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => beginEdit(contact)}><Edit2 className="size-4" /><span className="sm:hidden ml-2">Edit</span></Button>
                <Button variant="ghost" size="sm" onClick={() => void archive(contact)} className="text-red-600"><Trash2 className="size-4" /><span className="sm:hidden ml-2">Remove</span></Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
