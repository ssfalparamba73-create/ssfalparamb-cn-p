"use client";

import { useState } from "react";
import { Copy, ExternalLink, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface MemberInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  phone: string;
  pin: string;
}

function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("91")) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function MemberInviteDialog({
  isOpen,
  onClose,
  memberName,
  phone,
  pin,
}: MemberInviteDialogProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleClose = () => {
    setIsCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pin);
    setIsCopied(true);
  };

  const handleWhatsApp = () => {
    const message = `Welcome to SSF Alparamb! Your login phone number is ${phone} and your PIN is ${pin}.`;
    const whatsappUrl = `https://wa.me/${toWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Member"
      description={`Share the login details with ${memberName}.`}
      maxWidth="sm"
    >
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Key className="w-4 h-4 text-blue-600" />
          <span>One-time PIN</span>
        </div>
        <div className="text-4xl font-mono font-bold tracking-widest text-slate-900 dark:text-slate-50 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          {pin}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleCopy} variant="outline" className="w-full">
            <Copy className="w-4 h-4 mr-2 text-slate-500" />
            {isCopied ? "Copied!" : "Copy PIN"}
          </Button>
          <Button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Share via WhatsApp
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={handleClose} className="w-full">
          Done
        </Button>
      </div>
    </Modal>
  );
}
