"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Edit2, Trash2, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { EventReceiptTheme, SpecialEventDTO } from "@/lib/backend/dto/event.dto";
import { archiveAdminEvent, createAdminEvent, getAdminEvents, updateAdminEvent } from "@/lib/api/eventClient";

interface EventFormState {
  name: string;
  minimumAmount: string;
  receiptTheme: EventReceiptTheme;
  isActive: boolean;
}

const emptyForm: EventFormState = { name: "", minimumAmount: "50", receiptTheme: "default", isActive: true };

function toForm(event?: SpecialEventDTO): EventFormState {
  return event ? {
    name: event.name,
    minimumAmount: String(event.minimumAmount),
    receiptTheme: event.receiptTheme,
    isActive: event.isActive,
  } : emptyForm;
}

export function EventsConfigManager() {
  const [events, setEvents] = useState<SpecialEventDTO[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try { setEvents(await getAdminEvents()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load events."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  const cancel = () => { setIsAdding(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const input = {
        name: form.name,
        minimumAmount: Number(form.minimumAmount),
        receiptTheme: form.receiptTheme,
        isActive: form.isActive,
      };
      if (editingId) await updateAdminEvent(editingId, input);
      else await createAdminEvent(input);
      toast.success(editingId ? "Event updated successfully." : "Event created successfully.");
      cancel();
      await load();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save event.");
    } finally { setIsSaving(false); }
  };

  const archive = async (event: SpecialEventDTO) => {
    if (!window.confirm(`Archive ${event.name}? Existing payment history will remain unchanged.`)) return;
    try {
      await archiveAdminEvent(event.id);
      toast.success("Event archived successfully.");
      await load();
    } catch (archiveError) {
      toast.error(archiveError instanceof Error ? archiveError.message : "Unable to archive event.");
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Event Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-white dark:bg-slate-950" /></div>
        <div className="space-y-2"><Label>Minimum Amount (₹)</Label><Input type="number" min="1" step="0.01" value={form.minimumAmount} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} required className="bg-white dark:bg-slate-950 font-mono" /></div>
        <div className="space-y-2"><Label>Receipt Theme</Label><Select value={form.receiptTheme} onValueChange={(value) => setForm({ ...form, receiptTheme: value as EventReceiptTheme })}><SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Default Blue</SelectItem><SelectItem value="amber">Amber/Gold (Ceremonial)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Status</Label><Select value={form.isActive ? "active" : "inactive"} onValueChange={(value) => setForm({ ...form, isActive: value === "active" })}><SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active (Visible to users)</SelectItem><SelectItem value="inactive">Inactive (Hidden)</SelectItem></SelectContent></Select></div>
      </div>
      <p className="text-xs text-slate-500">Saving an event only stores its configuration. It does not activate payment collection.</p>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={cancel}>Cancel</Button><Button type="submit" disabled={isSaving} className="bg-blue-600 text-white">{isSaving ? "Saving..." : "Save Event"}</Button></div>
    </form>
  );

  return (
    <div className="space-y-6">
      {!isAdding && !editingId && <Button onClick={() => { setIsAdding(true); setForm(emptyForm); }} className="bg-blue-600 text-white"><Plus className="w-4 h-4 mr-2" /> Create New Event</Button>}
      {isAdding && renderForm()}
      {error && <Card className="p-4 text-sm text-red-700">{error} <Button variant="link" onClick={() => void load()}>Retry</Button></Card>}
      {isLoading && <p className="text-sm text-slate-500">Loading events...</p>}
      {!isLoading && !error && events.length === 0 && <Card className="p-6 text-center text-sm text-slate-500">No special events have been created yet.</Card>}
      <div className="grid grid-cols-1 gap-4">
        {events.map((event) => (
          <Card key={event.id} className="p-4 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            {editingId === event.id ? renderForm() : (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center justify-center shrink-0"><CalendarDays className="w-6 h-6" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><h3 className="font-bold truncate">{event.name}</h3>{event.isActive ? <Badge variant="outline" className="text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500"><span className="font-mono text-slate-700 dark:text-slate-300">Min: ₹{event.minimumAmount}</span><span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(event.createdAt).toLocaleDateString()}</span>{event.receiptTheme === "amber" && <span className="text-amber-600">Amber Theme</span>}</div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto border-t pt-2 sm:border-0 sm:pt-0"><Button variant="ghost" size="sm" onClick={() => { setEditingId(event.id); setIsAdding(false); setForm(toForm(event)); }}><Edit2 className="size-4" /><span className="sm:hidden ml-2">Edit</span></Button><Button variant="ghost" size="sm" onClick={() => void archive(event)} className="text-red-600"><Trash2 className="size-4" /><span className="sm:hidden ml-2">Delete</span></Button></div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
