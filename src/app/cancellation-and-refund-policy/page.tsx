import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | SSF Alparamba",
  description: "How cancellation and refund enquiries are handled for portal contribution payments.",
};

export default function CancellationAndRefundPolicyPage() {
  return (
    <PublicPolicyShell
      eyebrow="Payment Support"
      title="Cancellation and Refund Policy"
      description="How to stop an incomplete checkout and request review of a contribution that has already been processed."
    >
      <PolicySection title="Before payment completion">
        <p>
          A checkout may be closed before payment is completed. No contribution is treated as paid unless the payment provider and portal successfully verify it.
        </p>
      </PolicySection>

      <PolicySection title="After payment confirmation">
        <p>
          A captured contribution cannot be automatically cancelled from the portal. A member may request review through an official support channel.
          Do not share a PIN, login code, card number, CVV, or banking password with the unit.
        </p>
      </PolicySection>

      <PolicySection title="Situations that may be reviewed">
        <PolicyList items={[
          "A duplicate contribution for the same member and period.",
          "An incorrect amount caused by a verified technical or recording error.",
          "A successful debit that was not correctly associated with the intended member contribution.",
          "Another exceptional case approved by the authorised unit committee and permitted by applicable rules.",
        ]} />
      </PolicySection>

      <PolicySection title="Review and processing">
        <p>
          The member should provide the payment reference, date, amount, and reason for the request. The unit will verify the portal record and payment-provider status before deciding the request.
          If approved, the applicable initiation and expected bank-processing timeline will be communicated through an official support channel.
        </p>
      </PolicySection>

      <PolicySection title="Submit a request">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/contact">View official contact channels</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
