"use client";

import { CheckCircle2, Copy, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MemberInvitationDialogProps {
  memberName: string;
  phone: string;
  pin: string;
  message: string;
  title?: string;
  description?: string;
  onClose: () => void;
}

export function MemberInvitationDialog({
  memberName,
  phone,
  pin,
  message,
  title = "Member created successfully",
  description,
  onClose,
}: MemberInvitationDialogProps) {
  const whatsappNumber = phone.replace(/\D/g, "");

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-invitation-title"
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl pointer-events-auto dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-green-50 p-2 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 id="member-invitation-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description ?? `Send ${memberName}'s login invitation now. Keep this PIN private.`}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close invitation dialog">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="my-6 rounded-lg border border-blue-100 bg-blue-50 p-5 text-center dark:border-blue-900/50 dark:bg-blue-900/20">
            <p className="font-mono text-4xl font-bold tracking-[0.35em] text-blue-700 dark:text-blue-300">{pin}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Phone: {phone}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  toast.success("Login invitation copied.");
                } catch {
                  toast.error("Unable to copy the invitation.");
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button asChild className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Invite
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
