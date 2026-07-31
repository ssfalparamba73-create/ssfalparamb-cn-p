import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Shipping Policy | SSF Alparamba",
  description: "Digital delivery and no-shipping policy for the SSF Alparamba Contribution Portal.",
};

export default function ShippingPolicyPage() {
  return (
    <PublicPolicyShell
      eyebrow="Digital Service Policy"
      title="Shipping Policy"
      description="The portal manages member contributions and digital records; it does not sell or ship physical products."
    >
      <PolicySection title="No physical goods are shipped">
        <p>
          SSF Alparamba Contribution Portal does not sell, dispatch, or deliver physical products. Therefore, shipping charges, courier tracking,
          delivery addresses, and physical delivery timelines do not apply.
        </p>
      </PolicySection>

      <PolicySection title="Digital confirmation">
        <p>
          When a contribution is successfully verified and recorded, the related account status and any available receipt are provided digitally through the portal.
        </p>
      </PolicySection>

      <PolicySection title="Confirmation delays">
        <p>
          Bank, network, or payment-provider delays can temporarily postpone confirmation. Members should not repeat a payment solely because the portal is still verifying it.
        </p>
      </PolicySection>

      <PolicySection title="Questions">
        <p>For a missing confirmation or receipt, share the payment reference only through an official support channel.</p>
        <Button asChild variant="outline" className="mt-2 rounded-xl">
          <Link href="/contact">Open contact details</Link>
        </Button>
      </PolicySection>
    </PublicPolicyShell>
  );
}
