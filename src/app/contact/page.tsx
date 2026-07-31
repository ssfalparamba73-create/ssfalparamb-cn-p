import type { Metadata } from "next";
import { ContactDetails } from "@/components/public/ContactDetails";
import { PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Contact | SSF Alparamba",
  description: "Official support contacts for the SSF Alparamba Contribution Portal.",
};

export default function ContactPage() {
  return (
    <PublicPolicyShell
      eyebrow="Official Support"
      title="Contact SSF Alparamba Unit"
      description="Use an active channel listed below for contribution, receipt, account, privacy, or refund-related questions."
    >
      <PolicySection title="Available contacts">
        <ContactDetails />
      </PolicySection>
      <PolicySection title="Payment safety">
        <p>
          Share only the payment reference, date, and amount needed to locate a transaction. Never share your PIN, login code, CVV, full card number, or banking password.
        </p>
      </PolicySection>
    </PublicPolicyShell>
  );
}
