import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const policyLinks = [
  { href: "/contribution-details", label: "Dues & Payment Details" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/cancellation-and-refund-policy", label: "Cancellation & Refunds" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact" },
];

interface PublicPolicyShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PublicPolicyShell({
  eyebrow,
  title,
  description,
  children,
}: PublicPolicyShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.14),transparent_24rem),radial-gradient(circle_at_88%_18%,rgba(34,197,94,0.12),transparent_22rem),linear-gradient(135deg,#f8fbff_0%,#eef8ff_52%,#effdf7_100%)] text-slate-950">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="container flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="SSF Alparamba home">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <Image src="/logo/logo-transparent.svg" alt="SSF Logo" width={30} height={30} className="size-8 object-contain" />
            </span>
            <span className="truncate text-base font-bold text-slate-900">
              <span className="font-cooper font-normal">SSF</span> Alparamba Unit
            </span>
          </Link>
          <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white/80">
            <Link href="/">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="container px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 max-w-3xl space-y-4 md:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
              <ShieldCheck className="size-4" />
              {eyebrow}
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 md:text-4xl">{title}</h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 md:text-lg">{description}</p>
            <p className="text-xs font-semibold text-slate-400">Last updated: 31 July 2026</p>
          </div>

          <Card className="rounded-[1.25rem] border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <CardContent className="space-y-8 p-5 md:p-8">{children}</CardContent>
          </Card>
        </div>
      </main>

      <PublicPolicyFooter />
    </div>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-slate-100 pb-8 last:border-0 last:pb-0">
      <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm font-medium leading-7 text-slate-600 md:text-base">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((item) => (
        <li key={item} className="list-disc marker:text-blue-500">{item}</li>
      ))}
    </ul>
  );
}

export function PublicPolicyFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/75 py-8 backdrop-blur-xl">
      <div className="container space-y-5 px-4 md:px-8">
        <nav aria-label="Policies" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-semibold text-slate-500">
          {policyLinks.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex items-center gap-1 hover:text-blue-600">
              {link.label}
              <ExternalLink className="size-3" />
            </Link>
          ))}
        </nav>
        <p className="text-center text-xs font-semibold text-slate-400">
          © {new Date().getFullYear()} SSF Alparamba Unit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
