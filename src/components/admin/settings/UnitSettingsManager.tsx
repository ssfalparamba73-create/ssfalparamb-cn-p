"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, UploadCloud } from "lucide-react";
import type { UnitSettingsDTO } from "@/lib/backend/dto/unitSettings.dto";
import { getUnitSettings, updateUnitSettings } from "@/lib/api/settingsClient";

const emptySettings: UnitSettingsDTO = {
  unitName: "",
  branchSector: "",
  officialEmail: "",
  address: "",
  cityDistrict: "",
  pinCode: "",
};

export function UnitSettingsManager() {
  const [settings, setSettings] = useState<UnitSettingsDTO>(emptySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSettings(await getUnitSettings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load unit settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      setSettings(await updateUnitSettings(settings));
      toast.success("Unit settings saved successfully.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save unit settings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: keyof UnitSettingsDTO, value: string) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} {isLoading && "Loading..."}</div>}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Unit Identity</CardTitle><CardDescription>Configure the official name, branch, and logo for your unit.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Unit Name</Label><Input value={settings.unitName} onChange={(e) => field("unitName", e.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
            <div className="space-y-2"><Label>Branch / Sector</Label><Input value={settings.branchSector} onChange={(e) => field("branchSector", e.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Official Email Address</Label><Input type="email" value={settings.officialEmail} onChange={(e) => field("officialEmail", e.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
          </div>
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Label>Unit Logo</Label>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden relative"><Image src="/logo/logo-transparent.svg" alt="Unit Logo" fill className="object-contain p-2" /></div>
              <div className="space-y-2">
                <Input type="file" accept="image/*" className="hidden" id="logo-upload" disabled />
                <Label htmlFor="logo-upload" title="Logo storage is not connected yet" className="cursor-not-allowed opacity-50 inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 bg-white h-9 px-4 py-2"><UploadCloud className="w-4 h-4 mr-2" /> Change Logo</Label>
                <p className="text-xs text-slate-500">Logo upload is not enabled yet. The current approved logo remains unchanged.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2"><Button onClick={() => void save()} disabled={isLoading || isSaving} className="bg-blue-600 text-white"><Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}</Button></div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Address & Contact Details</CardTitle><CardDescription>This information will appear on generated receipts.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Complete Address</Label><Input value={settings.address} onChange={(e) => field("address", e.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>City / District</Label><Input value={settings.cityDistrict} onChange={(e) => field("cityDistrict", e.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
            <div className="space-y-2"><Label>PIN Code</Label><Input value={settings.pinCode} onChange={(e) => field("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" /></div>
          </div>
          <div className="flex justify-end pt-2"><Button onClick={() => void save()} disabled={isLoading || isSaving} className="bg-blue-600 text-white"><Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Address"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
