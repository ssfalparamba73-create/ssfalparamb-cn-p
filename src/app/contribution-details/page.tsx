import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Educational Subscription Details | SSF Alparamba",
  description: "How educational program subscriptions are reviewed, recorded, and confirmed through the portal.",
};

export default function ContributionDetailsPage() {
  return (
    <PublicPolicyShell
      eyebrow="Subscription & Payment Information"
      title="Educational Subscription Details"
      description="A clear overview of how monthly educational subscriptions and event payments are presented and recorded."
    >
      <PolicySection title="Purpose of Funds">
        <p>
          The funds collected through this portal are dedicated strictly to funding <strong>Community Skill Development and Educational Programs</strong>. This ensures transparent usage of all subscriptions towards our core mission of education and empowerment.
        </p>
      </PolicySection>

      <PolicySection title="Monthly Educational Subscriptions">
        <p>
          This portal is used exclusively for managing monthly educational subscriptions from registered students and members. Payments are linked to the user's profile and applicable study period. We do not sell physical products; this is entirely a digital subscription for skill development resources and services.
        </p>
        <p className="mt-4 text-sm text-slate-500 font-medium">
          <strong>Entity Disclaimer:</strong> All funds are collected and managed independently by the local Alparamba committee for local community educational initiatives.
        </p>
      </PolicySection>

      <PolicySection title="Who Can Subscribe?">
        <p>Only registered students and members, whose mobile number has been enrolled by an authorised committee administrator, can access this portal to subscribe to our educational programs.</p>
      </PolicySection>

      <PolicySection title="What the portal supports">
        <PolicyList items={[
          "Monthly educational subscriptions associated with a registered student profile.",
          "Approved skill-development event tickets when an event is enabled by the unit.",
          "Digital payment status, learning access history, and receipts after server-side confirmation.",
        ]} />
      </PolicySection>

      <PolicySection title="Educational Tiers & Pricing">
        <p>
          Educational subscription amounts are categorized into two tiers based on the enrolled program:
        </p>
        <PolicyList items={[
          "Base Educational Program: ₹50 per month",
          "Premium Educational Program: ₹100 per month"
        ]} />
        <p className="mt-4">
          The final payable amount is calculated based on the selected number of months and is shown for review before a payment is initiated. All amounts displayed by this portal are in Indian Rupees (INR), unless clearly stated otherwise.
        </p>
      </PolicySection>

      <PolicySection title="How confirmation works">
        <PolicyList items={[
          "The user reviews the applicable educational period or subscription amount before continuing.",
          "When online payment is enabled, checkout is handled through the approved payment provider.",
          "A subscription is treated as confirmed only after the portal verifies the transaction.",
          "A digital receipt and program access become available after successful confirmation.",
        ]} />
      </PolicySection>

      <PolicySection title="Digital Delivery Only">
        <p>
          Educational subscriptions do not involve the sale or shipment of physical goods. Confirmation, account updates, learning resources, and available receipts are delivered digitally.
        </p>
      </PolicySection>

      <PolicySection title="Need clarification?">
        <p>If an amount or subscription period appears incorrect, contact the administration before completing payment.</p>
        <Button asChild variant="outline" className="mt-2 rounded-xl">
          <Link href="/contact">Contact Administration</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
