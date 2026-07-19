"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PremiumReceiptCard } from "@/components/receipt/PremiumReceiptCard";

export function ReceiptBuilder() {
  const [bgImage, setBgImage] = useState("/recept.svg"); // Default background

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setBgImage(e.target?.result as string);
        toast.success("Background image updated for this local preview only");
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefault = () => {
    setBgImage("/recept.svg");
    toast.info("Reset to default receipt design");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Design Configuration</CardTitle>
            <CardDescription>
              Customize the look and feel of the payment receipt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Background Image</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-900 w-full max-w-sm h-32 flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload new design</span>
                    <span className="text-xs text-slate-500 mt-1">SVG, PNG, JPG (Max 2MB)</span>
                  </div>
                </div>
                {bgImage !== "/recept.svg" && (
                  <Button variant="outline" size="sm" onClick={resetToDefault} className="w-fit">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Layout Details</h3>
              <p className="text-sm text-slate-500">
                The current layout is locked to the standard format. Name, Date, Amount, and Receipt Number positions are pre-configured to match the default design perfectly.
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This screen currently provides a local preview only. Saving will be enabled with payment integration.
            </p>

            <Button disabled title="Available after payment integration" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-4">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Live Preview</h3>
        <p className="text-sm text-slate-500 mb-4">This is how the receipt will look to the members.</p>

        <div className="bg-slate-100 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-[400px] shadow-2xl rounded-2xl overflow-hidden bg-white">
            <PremiumReceiptCard
              receiptId="REC-2026-8942"
              method="cash"
              admin="Shibili (Admin)"
              phone="9876543210"
              amount="500"
              category="special_event"
              customBg={bgImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
