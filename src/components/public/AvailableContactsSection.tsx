"use client";

import { useEffect, useState } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import type { SupportContactDTO } from "@/lib/backend/dto/support.dto";
import { getSupportContacts } from "@/lib/api/supportClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PolicySection } from "@/components/public/PublicPolicyShell";

export function AvailableContactsSection() {
  const [contacts, setContacts] = useState<SupportContactDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSupportContacts()
      .then((result) => {
        if (!active) return;
        setContacts(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <PolicySection title="Available contacts">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </PolicySection>
    );
  }

  if (contacts.length === 0) return null;

  return (
    <PolicySection title="Available contacts">
      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((contact) => {
          const phone = contact.phone.replace(/\D/g, "");
          return (
            <div key={contact.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-900">{contact.name}</p>
              {contact.role && <p className="mb-3 text-xs font-semibold text-slate-500">{contact.role}</p>}
              <div className="space-y-2 text-sm">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-blue-700 hover:underline">
                  <Phone className="size-4" /> {contact.phone}
                </a>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 break-all text-blue-700 hover:underline">
                    <Mail className="size-4" /> {contact.email}
                  </a>
                )}
                {contact.whatsappEnabled && phone && (
                  <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-green-700 hover:underline">
                    <MessageSquare className="size-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PolicySection>
  );
}
