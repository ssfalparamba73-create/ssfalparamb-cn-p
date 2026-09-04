import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { AvailableContactsSection } from "@/components/public/AvailableContactsSection";
import { PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Contact | SSF Alparamba",
  description: "Official support contacts for the SSF Alparamba Contribution Portal.",
};

const officeBearers = [
  { name: "Muhammed Farhan Kk", role: "President", phone: "9074884847" },
  { name: "Muhammed Ismail", role: "General Secretary", phone: "7736338774" },
];

export default function ContactPage() {
  return (
    <PublicPolicyShell
      eyebrow="Official Support"
      title="Contact SSF Alparamba Unit"
      description="Use an active channel listed below for contribution, receipt, account, privacy, or refund-related questions."
    >
      <PolicySection title="Office Bearers">
        <div className="grid gap-3 sm:grid-cols-2">
          {officeBearers.map((bearer) => (
            <div key={bearer.phone} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="font-bold text-slate-900">{bearer.name}</p>
              <p className="mb-3 text-xs font-semibold text-slate-500">{bearer.role}</p>
              <a href={`tel:${bearer.phone}`} className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                <Phone className="size-4" /> {bearer.phone}
              </a>
            </div>
          ))}
        </div>
      </PolicySection>

      <PolicySection title="Unit Office & Correspondence">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
            <a href="mailto:ssf.alparamba.73@gmail.com" className="font-medium text-blue-700 hover:underline">ssf.alparamba.73@gmail.com</a>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Postal Address</p>
            <p className="font-medium text-slate-900">
              Students Centre Alparamba<br/>
              Alparamba, Andhiyoour Kunnu PO<br/>
              Malappuram, Kerala - 673637
            </p>
          </div>
        </div>
      </PolicySection>
      <AvailableContactsSection />
      <PolicySection title="Payment safety">
        <p>
          Share only the payment reference, date, and amount needed to locate a transaction. Never share your PIN, login code, CVV, full card number, or banking password.
        </p>
      </PolicySection>
    </PublicPolicyShell>
  );
}
