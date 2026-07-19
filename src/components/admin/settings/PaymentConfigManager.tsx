"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export function PaymentConfigManager() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>UPI & QR Code</CardTitle>
          <CardDescription>Configure the official UPI ID and QR code used for digital payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Official UPI ID</Label>
              <Input disabled defaultValue="ssfalparamba@okaxis" className="bg-slate-50 dark:bg-slate-950" />
            </div>
            <div className="space-y-2">
              <Label>Merchant Name</Label>
              <Input disabled defaultValue="SSF Alparamba Unit" className="bg-slate-50 dark:bg-slate-950" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>QR Code Image URL (Optional)</Label>
              <Input disabled placeholder="https://..." className="bg-slate-50 dark:bg-slate-950" />
              <p className="text-xs text-slate-500">If left blank, the system will auto-generate a QR code based on the UPI ID.</p>
            </div>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Payment integration is not active yet. These values are read-only and are not saved.
          </p>
          <div className="flex justify-end pt-2">
            <Button disabled title="Available after payment integration" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save UPI Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>Monthly Dues Settings</CardTitle>
          <CardDescription>Set the minimum contribution amounts for monthly tiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Dues Frequency</Label>
              <Select disabled defaultValue="monthly">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bimonthly">Bi-Monthly (2 Months)</SelectItem>
                  <SelectItem value="quarterly">Quarterly (3 Months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Tier (₹)</Label>
              <Input disabled type="number" defaultValue="50" className="bg-slate-50 dark:bg-slate-950 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Premium Tier (₹)</Label>
              <Input disabled type="number" defaultValue="100" className="bg-slate-50 dark:bg-slate-950 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Custom Min (₹)</Label>
              <Input disabled type="number" defaultValue="10" className="bg-slate-50 dark:bg-slate-950 font-mono" />
            </div>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Dues configuration will be enabled together with payment integration. No changes are saved now.
          </p>
          <div className="flex justify-end pt-2">
            <Button disabled title="Available after payment integration" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Dues Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle>Receipt Configuration</CardTitle>
          <CardDescription>Format how receipts are generated and numbered.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Receipt Prefix</Label>
              <Input disabled defaultValue="REC" className="bg-slate-50 dark:bg-slate-950 font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Include Year in Receipt ID?</Label>
              <Select disabled defaultValue="yes">
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (e.g. REC-2026-001)</SelectItem>
                  <SelectItem value="no">No (e.g. REC-001)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Receipt numbering is not connected to persistent payment records yet, so this section is read-only.
          </p>
          <div className="flex justify-end pt-2">
            <Button disabled title="Available after payment integration" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Receipt Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
