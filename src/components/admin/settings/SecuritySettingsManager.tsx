"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Save, ShieldAlert } from "lucide-react";
import { BackendApiError } from "@/lib/api/backendClient";
import {
  getMemberInvitationTemplate,
  updateMemberInvitationTemplate,
} from "@/lib/api/settingsClient";
import {
  MEMBER_INVITATION_TEMPLATE_MAX_LENGTH,
  renderMemberInvitationTemplate,
} from "@/lib/memberInvitation";

export function SecuritySettingsManager() {
  const router = useRouter();
  const [invitationTemplate, setInvitationTemplate] = useState("");
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMemberInvitationTemplate()
      .then((result) => {
        if (!active) return;
        setInvitationTemplate(result.template);
        setTemplateError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof BackendApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active) {
          setTemplateError(
            error instanceof Error
              ? error.message
              : "Unable to load the invitation message."
          );
        }
      })
      .finally(() => {
        if (active) setIsTemplateLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const handleInvitationTemplateSave = async () => {
    setIsTemplateSaving(true);
    setTemplateError(null);
    try {
      const saved = await updateMemberInvitationTemplate({
        template: invitationTemplate,
      });
      setInvitationTemplate(saved.template);
      toast.success("Member invitation message saved successfully.");
    } catch (error) {
      if (error instanceof BackendApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save the invitation message.";
      setTemplateError(message);
      toast.error(message);
    } finally {
      setIsTemplateSaving(false);
    }
  };

  const invitationPreview = invitationTemplate
    ? renderMemberInvitationTemplate(invitationTemplate, {
        name: "Sample Member",
        phone: "9876543210",
        pin: "••••",
      })
    : "";

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
              <Select defaultValue="4" disabled>
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
              <Select defaultValue="never" disabled>
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
              <Select defaultValue="5" disabled>
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
              <Select defaultValue="15" disabled>
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

            <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Force PIN Change on First Login</h3>
                  <p className="text-sm text-slate-500">Require members to change their system-generated PIN immediately after their first successful login.</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked
                    disabled
                    readOnly
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member UI Preview</p>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/20 border border-rose-400/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20 border border-amber-400/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20 border border-emerald-400/50"></div>
                  </div>
                </div>

                <div className="p-6 sm:p-10 flex justify-center items-center">
                  {/* The Mock Modal */}
                  <div className="w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none"></div>

                    <div className="p-6 relative z-10 text-center">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
                        <ShieldAlert className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                        Welcome to SSF Alparamba
                      </h3>

                      <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 mb-6 font-medium" style={{ fontFamily: "'Noto Sans Malayalam', sans-serif" }}>
                        നിങ്ങളുടെ അക്കൗണ്ടിന്റെ സുരക്ഷയ്ക്കായി സിസ്റ്റം നൽകിയ പാസ്‌വേഡ് മാറ്റി, പുതിയൊരു രഹസ്യ പിൻ (PIN) നിർബന്ധമായും സെറ്റ് ചെയ്യുക.
                      </p>

                      <div className="space-y-3">
                        <div className="flex justify-center gap-2 mb-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-12 h-14 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-xl font-bold text-slate-400">
                              *
                            </div>
                          ))}
                        </div>
                        <Button disabled title="Preview only" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 font-semibold text-[15px]">
                          Set New PIN & Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="text-right">
              <p className="mb-2 text-xs text-slate-500">Dynamic PIN policy changes are not enabled yet.</p>
              <Button disabled className="bg-blue-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Security Rules
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            Member Invitation Message
          </CardTitle>
          <CardDescription>
            Edit the WhatsApp message used when a new member PIN is generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="member-invitation-template">Default WhatsApp Message</Label>
            <Textarea
              id="member-invitation-template"
              value={invitationTemplate}
              onChange={(event) => setInvitationTemplate(event.target.value)}
              maxLength={MEMBER_INVITATION_TEMPLATE_MAX_LENGTH}
              rows={6}
              disabled={isTemplateLoading || isTemplateSaving}
              className="min-h-32 bg-slate-50 dark:bg-slate-950"
              aria-describedby="member-invitation-template-help member-invitation-template-error"
            />
            <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p id="member-invitation-template-help">
                Available placeholders: {"{name}"}, {"{phone}"}, {"{pin}"}. Phone and PIN are required.
              </p>
              <p className="tabular-nums">
                {invitationTemplate.length}/{MEMBER_INVITATION_TEMPLATE_MAX_LENGTH}
              </p>
            </div>
            {templateError && (
              <p id="member-invitation-template-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {templateError}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Message Preview
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
              {isTemplateLoading ? "Loading invitation message..." : invitationPreview || "--"}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleInvitationTemplateSave}
              disabled={isTemplateLoading || isTemplateSaving || !invitationTemplate.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isTemplateSaving ? "Saving..." : "Save Invitation Message"}
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
            <Select defaultValue="enabled" disabled>
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
            <div className="text-right">
              <p className="mb-2 text-xs text-slate-500">Biometric authentication is not enabled yet.</p>
              <Button disabled className="bg-blue-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Biometric Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
