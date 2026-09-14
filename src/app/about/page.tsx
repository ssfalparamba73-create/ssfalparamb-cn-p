import type { Metadata } from "next";
import { PolicySection, PublicPolicyShell } from "@/components/public/PublicPolicyShell";

export const metadata: Metadata = {
  title: "About Us | SSF Alparamba",
  description: "Learn more about the SSF Alparamba unit and our mission.",
};

export default function AboutPage() {
  return (
    <PublicPolicyShell
      eyebrow="Who We Are"
      title="About Us"
      description="Empowering the community through Skill Development and Educational Initiatives."
    >
      <PolicySection title="Our Mission">
        <p>
          At SSF Alparamba, our primary mission is to foster community growth by providing accessible educational resources, skill development workshops, and a platform for continuous learning. We believe that empowering individuals through knowledge and training builds a stronger, more resilient community.
        </p>
      </PolicySection>

      <PolicySection title="What We Do">
        <p>
          Through our dedicated portal, members and students can subscribe to various educational programs. We organize local workshops, distribute study materials, and host community events aimed at uplifting our youth. All contributions and subscription fees collected are strictly utilized for funding these educational initiatives.
        </p>
      </PolicySection>

      <PolicySection title="Community Driven">
        <p>
          Our organization is managed independently by the local Alparamba committee. We are a non-profit driven by passionate volunteers and educators committed to the betterment of our society.
        </p>
      </PolicySection>

      <PolicySection title="Contact Information">
        <p>
          For more information about our programs or to get involved, please visit our Contact page or reach out to our administrative committee directly.
        </p>
      </PolicySection>
    </PublicPolicyShell>
  );
}
