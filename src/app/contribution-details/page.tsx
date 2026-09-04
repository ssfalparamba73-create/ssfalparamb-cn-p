import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Support & Payment Details | SSF Alparamba",
  description: "How Member Support are reviewed, recorded, and confirmed through the SSF Alparamba portal.",
};

export default function ContributionDetailsPage() {
  return (
    <PublicPolicyShell
      eyebrow="Support & Payment Information"
      title="Member Support & Payment Details"
      description="A clear overview of how Monthly Support and approved event payments are presented and recorded in the portal."
    >
      <PolicySection title="Purpose of Funds">
        <p>
          The funds collected through this portal are dedicated strictly to <strong>Skill Development and Education</strong> initiatives within the community. This ensures transparent usage of member support towards our core mission.
        </p>
      </PolicySection>

      <PolicySection title="Monthly Membership Support">
        <p>
          This portal is used exclusively for collecting monthly membership support from registered SSF Alparamba Unit members. Payments are linked to the member's profile and applicable period. This portal does not sell physical products or commercial services.
        </p>
        <p className="mt-4 text-sm text-slate-500 font-medium">
          <strong>Entity Disclaimer:</strong> All funds are collected and managed independently by the local Alparamba committee for local initiatives. This is not an official collection channel for the state or national registered parent organization.
        </p>
      </PolicySection>

      <PolicySection title="Who Can Provide Support?">
        <p>Only registered members of SSF Alparamba Unit, whose mobile number has been enrolled by an authorised committee administrator, can access this portal and provide their support.</p>
      </PolicySection>

      <PolicySection title="What the portal supports">
        <PolicyList items={[
          "Monthly membership support associated with a registered and eligible member profile.",
          "Approved special-event support payments when an event is enabled by the unit.",
          "Digital payment status, collection history, and receipts after server-side confirmation.",
        ]} />
      </PolicySection>

      <PolicySection title="Amount and currency">
        <p>
          Dues amounts are based on the member category, applicable period, or approved event configuration maintained by SSF Alparamba Unit.
          The final payable amount is shown for review before a payment is initiated.
        </p>
        <p>All amounts displayed by this portal are in Indian Rupees (INR), unless clearly stated otherwise.</p>
      </PolicySection>

      <PolicySection title="How confirmation works">
        <PolicyList items={[
          "The member reviews the applicable period or dues amount before continuing.",
          "When online payment is enabled, checkout is handled through the approved payment provider.",
          "A payment is treated as confirmed only after the portal verifies the transaction with the provider.",
          "A digital receipt becomes available after successful confirmation and recording.",
        ]} />
      </PolicySection>

      <PolicySection title="No physical delivery">
        <p>
          Membership dues do not involve the sale or shipment of physical goods. Confirmation, account updates, and available receipts are delivered digitally.
        </p>
      </PolicySection>

      <PolicySection title="Need clarification?">
        <p>If an amount or dues period appears incorrect, contact the unit before completing payment.</p>
        <Button asChild variant="outline" className="mt-2 rounded-xl">
          <Link href="/contact">Contact the unit</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
