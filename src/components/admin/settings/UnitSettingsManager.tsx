"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, UploadCloud } from "lucide-react";
import Image from "next/image";

export function UnitSettingsManager() {
  const [logoPreview, setLogoPreview] = useState<string>("/logo.png");

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setLogoPreview(url);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>Unit Identity</CardTitle>
          <CardDescription>Configure the official name, branch, and logo for your unit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input defaultValue="SSF Alparamba Unit" className="bg-slate-50 dark:bg-slate-950" />
            </div>
            <div className="space-y-2">
              <Label>Branch / Sector</Label>
              <Input defaultValue="Alparamba Sector" className="bg-slate-50 dark:bg-slate-950" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Official Email Address</Label>
              <Input type="email" defaultValue="admin@ssfalparamba.com" className="bg-slate-50 dark:bg-slate-950" />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Label>Unit Logo</Label>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <Image src={logoPreview} alt="Unit Logo" fill className="object-contain p-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="logo-upload"
                    onChange={handleLogoUpload}
                  />
                  <Label 
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-9 px-4 py-2"
                  >
                    <UploadCloud className="w-4 h-4 mr-2" /> Change Logo
                  </Label>
                </div>
                <p className="text-xs text-slate-500">Recommended size: 512x512px (PNG with transparent background)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => handleSave('Unit Identity')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>Address & Contact Details</CardTitle>
          <CardDescription>This information will appear on generated receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Complete Address</Label>
            <Input defaultValue="Alparamba Juma Masjid, Downhill, Malappuram" className="bg-slate-50 dark:bg-slate-950" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City / District</Label>
              <Input defaultValue="Malappuram" className="bg-slate-50 dark:bg-slate-950" />
            </div>
            <div className="space-y-2">
              <Label>PIN Code</Label>
              <Input defaultValue="676519" className="bg-slate-50 dark:bg-slate-950" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => handleSave('Address')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Address
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
