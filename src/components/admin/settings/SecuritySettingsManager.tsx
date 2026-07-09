"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, ShieldAlert } from "lucide-react";

export function SecuritySettingsManager() {
  const [pinLength, setPinLength] = useState("4");
  
  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>PIN Rules & Authentication</CardTitle>
          <CardDescription>Configure the security rules for member login PINs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Required PIN Length</Label>
              <Select value={pinLength} onValueChange={setPinLength}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Digits (Standard)</SelectItem>
                  <SelectItem value="6">6 Digits (High Security)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Changing this will require all current members to update their PINs.</p>
            </div>
            
            <div className="space-y-2">
              <Label>PIN Expiry Policy</Label>
              <Select defaultValue="never">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never Expires</SelectItem>
                  <SelectItem value="90">Every 90 Days</SelectItem>
                  <SelectItem value="180">Every 180 Days</SelectItem>
                  <SelectItem value="365">Every Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Select defaultValue="5">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Failed Attempts</SelectItem>
                  <SelectItem value="5">5 Failed Attempts</SelectItem>
                  <SelectItem value="10">10 Failed Attempts</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Lockout Duration</Label>
              <Select defaultValue="15">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                  <SelectItem value="1440">24 Hours (Admin Unlock Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 p-4 rounded-xl flex items-start gap-3 border border-rose-100 dark:border-rose-800/30">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Security Warning</p>
              <p className="opacity-90">Tightening PIN rules will force active sessions to expire, requiring members to re-authenticate.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => handleSave('Security')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Security Rules
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>Biometric Settings</CardTitle>
          <CardDescription>Configure fingerprint and face recognition login options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Allow Biometric Login</Label>
            <Select defaultValue="enabled">
              <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled (Recommended)</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Allows members to use TouchID/FaceID instead of entering their PIN every time.</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => handleSave('Biometric')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Biometric Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
