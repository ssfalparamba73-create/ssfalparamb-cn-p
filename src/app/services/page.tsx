import type { Metadata } from "next";
import { PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "Our Services | SSF Alparamba",
  description: "Explore the educational and skill development services provided by SSF Alparamba.",
};

export default function ServicesPage() {
  return (
    <PublicPolicyShell
      eyebrow="What We Offer"
      title="Our Services"
      description="We are committed to empowering our community through dedicated educational and skill development programs."
    >
      <PolicySection title="1. Educational Programs & Subscriptions">
        <p>
          Our primary service is providing structured educational support to our community members. By subscribing to our portal, students gain access to:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-slate-600">
          <li>Community learning resources and study materials.</li>
          <li>Academic guidance and mentorship sessions.</li>
          <li>Digital access to educational records and program updates.</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. Skill Development Workshops">
        <p>
          We believe in equipping our youth with practical skills for the future. Our skill development services include:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-slate-600">
          <li>Interactive workshops on modern professional skills.</li>
          <li>Career guidance and counseling events.</li>
          <li>Leadership and community-building training.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Service Access">
        <p>
          These services are exclusively available to registered students and members of our community. Subscribers can manage their service tiers and event access directly through this portal. For detailed information on subscription fees, please visit our Pricing page.
        </p>
      </PolicySection>
    </PublicPolicyShell>
  );
}
