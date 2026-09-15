import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicyList, PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | SSF Alparamba",
  description: "How cancellation and refund enquiries are handled for educational subscriptions and portal payments.",
};

export default function CancellationAndRefundPolicyPage() {
  return (
    <PublicPolicyShell
      eyebrow="Payment Support"
      title="Cancellation and Refund Policy"
      description="How to stop an incomplete checkout and request review of an educational subscription payment that has already been processed."
    >
      <PolicySection title="General Policy (Non-Refundable)">
        <p>
          Educational subscriptions are generally <strong>non-refundable</strong> once the payment is confirmed, as they are collected for a specific active subscription period. 
        </p>
      </PolicySection>

      <PolicySection title="Before payment completion">
        <p>
          A checkout may be closed before payment is completed. No subscription payment is treated as paid unless the payment provider and portal successfully verify it.
        </p>
      </PolicySection>

      <PolicySection title="Cancellation Duration (After payment confirmation)">
        <p>
          A captured subscription payment cannot be automatically cancelled from the portal. If you wish to cancel a payment due to an error, the cancellation request must be raised within <strong>24 hours</strong> of the transaction. A member may request a manual review through an official support channel only for exceptional cases.
          Do not share a PIN, login code, card number, CVV, or banking password with the unit.
        </p>
      </PolicySection>

      <PolicySection title="Situations that may be reviewed">
        <PolicyList items={[
          "A duplicate subscriptions payment for the same member and period.",
          "An incorrect amount caused by a verified technical or recording error.",
          "A successful debit that was not correctly associated with the intended member's profile.",
          "Another exceptional case approved by the authorised unit committee and permitted by applicable rules.",
        ]} />
      </PolicySection>

      <PolicySection title="Refund Mode and Duration">
        <p>
          The member should provide the payment reference, date, amount, and reason for the request. The unit will verify the portal record and payment-provider status before deciding the request.
          If a refund is approved by the committee, the refund will be credited back to the <strong>original mode of payment</strong> (e.g., Bank Account, Credit Card, UPI) within <strong>5 to 7 business days</strong>.
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

