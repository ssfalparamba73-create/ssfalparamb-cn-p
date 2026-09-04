import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Privacy Policy | SSF Alparamba",
  description: "Privacy information for members and visitors using the SSF Alparamba Membership Portal.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicPolicyShell
      eyebrow="Privacy & Data"
      title="Privacy Policy"
      description="This policy explains the information used to operate the membership portal and protect member access."
    >
      <PolicySection title="Information handled by the portal">
        <PolicyList items={[
          "Member identity and contact details such as name, member code, and phone number.",
          "Profile information voluntarily provided for unit records, including family or blood-donor details where applicable.",
          "Membership dues, payment-status, receipt, and transaction-reference information.",
          "Authentication, session, device, request, and audit information needed to secure the portal.",
          "Support messages and contact details submitted when assistance is requested.",
        ]} />
      </PolicySection>

      <PolicySection title="How information is used">
        <PolicyList items={[
          "To authenticate members and authorised administrators.",
          "To maintain member records and display relevant dues information.",
          "To verify, record, reconcile, and report payments.",
          "To provide receipts, support, security monitoring, and an accountable audit history.",
          "To prevent duplicate, unauthorised, or fraudulent activity.",
        ]} />
      </PolicySection>

      <PolicySection title="Payment and service providers">
        <p>
          Information required to process or verify a payment may be shared with the approved payment provider and infrastructure providers that operate the portal.
          These providers process information under their own applicable terms and privacy practices.
        </p>
      </PolicySection>

      <PolicySection title="Storage, access, and retention">
        <p>
          Access is limited according to member and administrator permissions. Records may be retained where needed for payment history, audit, security,
          dispute resolution, and applicable organisational or legal requirements.
        </p>
      </PolicySection>

      <PolicySection title="Your choices">
        <p>
          Members may contact the unit to report inaccurate profile information or ask a privacy-related question. Some historical transaction and audit records may need to be preserved.
        </p>
        <Button asChild variant="outline" className="mt-2 rounded-xl">
          <Link href="/contact">Contact the unit</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
