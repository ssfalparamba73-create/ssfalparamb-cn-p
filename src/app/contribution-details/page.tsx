import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Contribution Details | SSF Alparamba",
  description: "How member contributions are reviewed, recorded, and confirmed through the SSF Alparamba portal.",
};

export default function ContributionDetailsPage() {
  return (
    <PublicPolicyShell
      eyebrow="Contribution Information"
      title="Member Contribution Details"
      description="A clear overview of how monthly and approved event contributions are presented and recorded in the portal."
    >
      <PolicySection title="Member Contribution">
        <p>
          This portal is used exclusively for collecting member contributions for SSF Alparamba Unit. Contributions are associated with the respective member and contribution period. This portal does not sell physical products or commercial services.
        </p>
      </PolicySection>

      <PolicySection title="Who Can Make a Contribution?">
        <p>Registered members/contributors of SSF Alparamba Unit can use this portal to make their applicable contributions.</p>
      </PolicySection>

      <PolicySection title="What the portal supports">
        <PolicyList items={[
          "Monthly member contributions associated with an eligible member profile.",
          "Approved special-event contributions when an event is enabled by the unit.",
          "Digital payment status, collection history, and receipts after server-side confirmation.",
        ]} />
      </PolicySection>

      <PolicySection title="Amount and currency">
        <p>
          Contribution amounts are based on the member category, applicable period, or approved event configuration maintained by SSF Alparamba Unit.
          The final payable amount is shown for review before a payment is initiated.
        </p>
        <p>All amounts displayed by this portal are in Indian Rupees (INR), unless clearly stated otherwise.</p>
      </PolicySection>

      <PolicySection title="How confirmation works">
        <PolicyList items={[
          "The member reviews the applicable period or contribution before continuing.",
          "When online payment is enabled, checkout is handled through the approved payment provider.",
          "A contribution is treated as confirmed only after the portal verifies the payment with the provider.",
          "A digital receipt becomes available after successful confirmation and recording.",
        ]} />
      </PolicySection>

      <PolicySection title="No physical delivery">
        <p>
          Contributions do not involve the sale or shipment of physical goods. Confirmation, account updates, and available receipts are delivered digitally.
        </p>
      </PolicySection>

      <PolicySection title="Need clarification?">
        <p>If an amount or contribution period appears incorrect, contact the unit before completing payment.</p>
        <Button asChild variant="outline" className="mt-2 rounded-xl">
          <Link href="/contact">Contact the unit</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
