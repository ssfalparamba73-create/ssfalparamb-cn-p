"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import type { UnitSettingsDTO } from "@/lib/backend/dto/unitSettings.dto";
import { getUnitSettings, updateUnitSettings } from "@/lib/api/settingsClient";
import { FormPageSkeleton } from "@/components/ui/loading-skeletons";
import { fetchQuery, getQuerySnapshot, setQueryData } from "@/lib/client/queryCache";
import { writeCachedBlockOptions } from "@/lib/client/safePersistentCache";

const emptySettings: UnitSettingsDTO = {
  unitName: "",
  branchSector: "",
  areas: [],
  officialEmail: "",
  address: "",
  cityDistrict: "",
  pinCode: "",
};

export function UnitSettingsManager() {
  const cachedSettings = getQuerySnapshot<UnitSettingsDTO>("admin:unit-settings").data;
  const [settings, setSettings] = useState<UnitSettingsDTO>(() => cachedSettings ?? emptySettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);
  const [savingSection, setSavingSection] = useState<"identity" | "blocks" | "address" | null>(null);
  const isSaving = savingSection !== null;
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await fetchQuery("admin:unit-settings", getUnitSettings, { staleTime: 15 * 60_000 });
      setSettings(loaded);
      writeCachedBlockOptions(loaded.areas);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load unit settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(() => void load()); }, []);

  const save = async (section: "identity" | "blocks" | "address") => {
    setSavingSection(section);
    setError(null);
    try {
      const saved = await updateUnitSettings(settings);
      setSettings(saved);
      setQueryData("admin:unit-settings", saved);
      writeCachedBlockOptions(saved.areas);
      toast.success("Unit settings saved successfully.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save unit settings.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingSection(null);
    }
  };

  const field = (key: keyof UnitSettingsDTO, value: string) => setSettings((current) => ({ ...current, [key]: value }));
  const updateArea = (index: number, value: string) => setSettings((current) => ({ ...current, areas: current.areas.map((area, areaIndex) => areaIndex === index ? value : area) }));
  const addArea = () => setSettings((current) => ({ ...current, areas: [...current.areas, ""] }));
  const removeArea = (index: number) => setSettings((current) => ({ ...current, areas: current.areas.filter((_, areaIndex) => areaIndex !== index) }));
  const moveArea = (index: number, direction: -1 | 1) => setSettings((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.areas.length) return current;
    const areas = [...current.areas];
    [areas[index], areas[target]] = [areas[target], areas[index]];
    return { ...current, areas };
  });

  if (isLoading && settings === emptySettings) {
    return <FormPageSkeleton />;
  }

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
          <div className="flex justify-end pt-2"><Button onClick={() => void save("identity")} disabled={isLoading || isSaving} className="bg-blue-600 text-white"><Save className="w-4 h-4 mr-2" /> {savingSection === "identity" ? "Saving..." : "Save Changes"}</Button></div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Blocks</CardTitle><CardDescription>Manage the Block options shown when creating, editing, and filtering members.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {settings.areas.map((area, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={area} maxLength={80} aria-label={"Block " + (index + 1)} placeholder="Enter Block name" onChange={(event) => updateArea(index, event.target.value)} disabled={isLoading || isSaving} className="bg-slate-50 dark:bg-slate-950" />
                <Button type="button" variant="outline" size="icon" aria-label="Move Block up" disabled={isLoading || isSaving || index === 0} onClick={() => moveArea(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Move Block down" disabled={isLoading || isSaving || index === settings.areas.length - 1} onClick={() => moveArea(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Remove Block" disabled={isLoading || isSaving || settings.areas.length === 1} onClick={() => removeArea(index)} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <Button type="button" variant="outline" onClick={addArea} disabled={isLoading || isSaving || settings.areas.length >= 50}><Plus className="mr-2 h-4 w-4" /> Add Block</Button>
            <Button onClick={() => void save("blocks")} disabled={isLoading || isSaving || settings.areas.length === 0} className="bg-blue-600 text-white"><Save className="mr-2 h-4 w-4" /> {savingSection === "blocks" ? "Saving..." : "Save Blocks"}</Button>
          </div>
          <p className="text-xs text-slate-500">Removing an option does not change the Block already stored on existing member profiles.</p>
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
          <div className="flex justify-end pt-2"><Button onClick={() => void save("address")} disabled={isLoading || isSaving} className="bg-blue-600 text-white"><Save className="w-4 h-4 mr-2" /> {savingSection === "address" ? "Saving..." : "Save Address"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
