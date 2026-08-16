"use client";

import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPaymentSettings, updatePaymentSettings, type PaymentSettings, type DuesFrequency } from "@/lib/api/paymentSettingsClient";

const defaults: PaymentSettings = {
  upiId: "ssfalparamba@okaxis",
  merchantName: "SSF Alparamba Unit",
  qrCodeUrl: "",
  duesFrequency: "monthly",
  baseTier: 50,
  premiumTier: 100,
  customMinimum: 10,
  receiptPrefix: "REC",
  includeYear: true,
};

export function PaymentConfigManager() {
  const [settings, setSettings] = useState(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPaymentSettings().then(setSettings).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load payment settings.")).finally(() => setIsLoading(false));
  }, []);

  const update = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setIsSaving(true);
    try {
      setSettings(await updatePaymentSettings(settings));
      toast.success("Payment settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save payment settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20">
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 size-5 text-green-600" />
          <div><p className="font-semibold text-green-800 dark:text-green-300">Razorpay payment gateway connected</p><p className="text-sm text-green-700 dark:text-green-400">Orders, verification, receipts, and webhook reconciliation are active.</p></div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>UPI & QR Code</CardTitle><CardDescription>These values are used on the member payment flow.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Official UPI ID</Label><Input value={settings.upiId} onChange={(e) => update("upiId", e.target.value)} disabled={isLoading || isSaving} /></div>
            <div className="space-y-2"><Label>Merchant Name</Label><Input value={settings.merchantName} onChange={(e) => update("merchantName", e.target.value)} disabled={isLoading || isSaving} /></div>
            <div className="space-y-2 md:col-span-2"><Label>QR Code Image URL (Optional)</Label><Input value={settings.qrCodeUrl} onChange={(e) => update("qrCodeUrl", e.target.value)} placeholder="https://..." disabled={isLoading || isSaving} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Dues Settings</CardTitle><CardDescription>Configure the contribution frequency and amounts used to resolve member dues.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2"><Label>Dues Frequency</Label><Select value={settings.duesFrequency} onValueChange={(value) => update("duesFrequency", value as DuesFrequency)} disabled={isLoading || isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly (1 month)</SelectItem><SelectItem value="bimonthly">Bi-Monthly (2 months)</SelectItem><SelectItem value="quarterly">Quarterly (3 months)</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Base Tier (₹)</Label><Input type="number" value={settings.baseTier} onChange={(e) => update("baseTier", Number(e.target.value))} disabled={isLoading || isSaving} /></div>
            <div className="space-y-2"><Label>Premium Tier (₹)</Label><Input type="number" value={settings.premiumTier} onChange={(e) => update("premiumTier", Number(e.target.value))} disabled={isLoading || isSaving} /></div>
            <div className="space-y-2"><Label>Custom Minimum (₹)</Label><Input type="number" value={settings.customMinimum} onChange={(e) => update("customMinimum", Number(e.target.value))} disabled={isLoading || isSaving} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader><CardTitle>Receipt Configuration</CardTitle><CardDescription>Receipt numbering is now stored with the payment settings.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Receipt Prefix</Label><Input value={settings.receiptPrefix} onChange={(e) => update("receiptPrefix", e.target.value.toUpperCase())} disabled={isLoading || isSaving} /></div>
            <div className="space-y-2"><Label>Include Year in Receipt ID?</Label><Select value={settings.includeYear ? "yes" : "no"} onValueChange={(value) => update("includeYear", value === "yes")} disabled={isLoading || isSaving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes (e.g. REC-2026-001)</SelectItem><SelectItem value="no">No (e.g. REC-001)</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex justify-end pt-2"><Button onClick={() => void save()} disabled={isLoading || isSaving} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="mr-2 size-4" />{isSaving ? "Saving..." : "Save Payment Settings"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
