import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Terms and Conditions | SSF Alparamba",
  description: "Terms for access to and use of the SSF Alparamba Contribution Portal.",
};

export default function TermsAndConditionsPage() {
  return (
    <PublicPolicyShell
      eyebrow="Portal Terms"
      title="Terms and Conditions"
      description="These terms apply when a member, administrator, or visitor accesses the SSF Alparamba Contribution Portal."
    >
      <PolicySection title="Purpose and permitted use">
        <p>
          The portal is provided for authorised member access, contribution records, approved unit administration, receipts, and related support.
          It must not be used to access another person&apos;s records or disrupt the service.
        </p>
      </PolicySection>

      <PolicySection title="Account responsibility">
        <PolicyList items={[
          "Provide accurate information and promptly report errors.",
          "Keep login codes and access credentials confidential.",
          "Use only the account and permissions assigned to you.",
          "Notify the unit if unauthorised access is suspected.",
        ]} />
      </PolicySection>

      <PolicySection title="Contribution and payment records">
        <p>
          Review the contribution period and amount before continuing. A browser message or checkout response alone does not create a final confirmed record.
          Confirmation occurs only after server-side verification and recording.
        </p>
      </PolicySection>

      <PolicySection title="Availability and corrections">
        <p>
          Temporary maintenance, connectivity, banking, or provider issues may affect availability. The unit may correct duplicate, inaccurate, unauthorised,
          or technically inconsistent records after appropriate verification.
        </p>
      </PolicySection>

      <PolicySection title="Related policies">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl"><Link href="/privacy-policy">Privacy Policy</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link href="/cancellation-and-refund-policy">Cancellation & Refunds</Link></Button>
        </div>
      </PolicySection>
    </PublicPolicyShell>
  );
}
