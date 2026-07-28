"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, RotateCcw, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { BackendApiError } from "@/lib/api/backendClient";
import {
  getMemberInvitationTemplate,
  updateMemberInvitationTemplate,
} from "@/lib/api/settingsClient";
import {
  MEMBER_INVITATION_DEFAULT_TEMPLATE,
  MEMBER_INVITATION_TEMPLATE_MAX_LENGTH,
  renderMemberInvitationTemplate,
} from "@/lib/memberInvitation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardCollectionSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDERS = ["{name}", "{phone}", "{pin}", "{loginUrl}"] as const;

function WhatsAppLine({ line }: { line: string }) {
  const parts = line.split(/(\*[^*\n]+\*|https?:\/\/\S+)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <strong key={`${part}-${index}`}>{part.slice(1, -1)}</strong>;
        }
        if (/^https?:\/\//.test(part)) {
          return <span key={`${part}-${index}`} className="text-[#027eb5]">{part}</span>;
        }
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
      })}
    </>
  );
}

export function MemberInvitationSettingsManager() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [template, setTemplate] = useState("");
  const [savedTemplate, setSavedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMemberInvitationTemplate()
      .then((result) => {
        if (!active) return;
        setTemplate(result.template);
        setSavedTemplate(result.template);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof BackendApiError && loadError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the WhatsApp message.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const missingRequired = ["{phone}", "{pin}"].filter(
    (placeholder) => !template.includes(placeholder)
  );
  const hasChanges = template !== savedTemplate;
  const canSave =
    !isLoading &&
    !isSaving &&
    Boolean(template.trim()) &&
    missingRequired.length === 0 &&
    hasChanges;

  const preview = template
    ? renderMemberInvitationTemplate(template, {
        name: "Sample Member",
        phone: "9074884847",
        pin: "1234",
        loginUrl: "https://portal.example/login?phone=9074884847",
      })
    : "";
  const previewLines = preview.split("\n");

  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setTemplate((current) => `${current}${placeholder}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setTemplate((current) => `${current.slice(0, start)}${placeholder}${current.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + placeholder.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateMemberInvitationTemplate({ template });
      setTemplate(saved.template);
      setSavedTemplate(saved.template);
      toast.success("Default WhatsApp invitation saved.");
    } catch (saveError) {
      if (saveError instanceof BackendApiError && saveError.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const message = saveError instanceof Error ? saveError.message : "Unable to save the WhatsApp message.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <CardCollectionSkeleton count={2} className="xl:grid-cols-2" cardClassName="min-h-[560px]" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-emerald-600" />
            Default WhatsApp Message
          </CardTitle>
          <CardDescription>
            This message is used when a member invitation or reusable login PIN is shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-invitation-template">Message text</Label>
            <Textarea
              ref={textareaRef}
              id="whatsapp-invitation-template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              maxLength={MEMBER_INVITATION_TEMPLATE_MAX_LENGTH}
              disabled={isLoading || isSaving}
              rows={20}
              dir="ltr"
              spellCheck={false}
              className="min-h-[460px] resize-y whitespace-pre-wrap bg-slate-50 text-left font-sans leading-7 dark:bg-slate-950"
              aria-describedby="whatsapp-template-help whatsapp-template-error"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p id="whatsapp-template-help" className="text-xs leading-5 text-slate-500">
                Keep <strong>{"{phone}"}</strong> and <strong>{"{pin}"}</strong>. Line breaks and WhatsApp
                bold markers such as <strong>*text*</strong> are preserved.
              </p>
              <p className="shrink-0 text-xs tabular-nums text-slate-500">
                {template.length}/{MEMBER_INVITATION_TEMPLATE_MAX_LENGTH}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Insert placeholder
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((placeholder) => (
                <Button
                  key={placeholder}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isSaving}
                  onClick={() => insertPlaceholder(placeholder)}
                  className="font-mono text-xs"
                >
                  {placeholder}
                </Button>
              ))}
            </div>
          </div>

          {missingRequired.length > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
              Required placeholder missing: {missingRequired.join(", ")}
            </p>
          )}
          {error && (
            <p id="whatsapp-template-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading || isSaving || !hasChanges}
                onClick={() => setTemplate(savedTemplate)}
              >
                <Undo2 className="mr-2 size-4" /> Undo changes
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isSaving || template === MEMBER_INVITATION_DEFAULT_TEMPLATE}
                onClick={() => setTemplate(MEMBER_INVITATION_DEFAULT_TEMPLATE)}
              >
                <RotateCcw className="mr-2 size-4" /> Use project default
              </Button>
            </div>
            <Button
              type="button"
              disabled={!canSave}
              onClick={() => void save()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSaving ? <Save className="mr-2 size-4 animate-pulse" /> : <Check className="mr-2 size-4" />}
              {isSaving ? "Saving..." : "Save WhatsApp Message"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-24">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex size-10 items-center justify-center rounded-full bg-white/15">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <p className="font-semibold">WhatsApp Preview</p>
            <p className="text-xs text-white/75">Final member invitation</p>
          </div>
        </div>
        <div className="min-h-[560px] bg-[#efeae2] p-4 dark:bg-[#111b21] sm:p-6">
          <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 shadow-sm dark:bg-[#005c4b]">
            {isLoading ? (
              <div className="space-y-2" aria-hidden>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div
                dir="auto"
                className="text-left text-[14px] leading-[1.55] text-[#111b21] [unicode-bidi:plaintext] dark:text-[#e9edef]"
              >
                {previewLines.map((line, index) => (
                  <React.Fragment key={`${index}-${line}`}>
                    {line ? <WhatsAppLine line={line} /> : <span>&nbsp;</span>}
                    {index < previewLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
                <div className="mt-1 text-right text-[11px] text-[#667781] dark:text-[#8696a0]">
                  10:30 AM <span className="text-[#53bdeb]">✓✓</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
