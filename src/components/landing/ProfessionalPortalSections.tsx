import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, BookOpenCheck, CircleHelp, FileCheck2, Headphones, LockKeyhole, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: LockKeyhole,
    title: "Sign in securely",
    description: "Members use their registered mobile number and the access code issued by the committee.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Review contribution details",
    description: "Check the applicable monthly contribution and selected period before continuing.",
  },
  {
    icon: ReceiptText,
    title: "Keep a clear record",
    description: "Confirmed contributions and receipts are shown in the member portal when payment services are enabled.",
  },
];

const assurances = [
  {
    icon: ShieldCheck,
    title: "Official unit portal",
    description: "A dedicated portal for SSF Alparamba Unit membership and contribution administration.",
  },
  {
    icon: FileCheck2,
    title: "Published policies",
    description: "Contribution, privacy, terms, cancellation, refund, and non-shipping information are publicly available.",
  },
  {
    icon: Headphones,
    title: "Committee support",
    description: "Active committee contact details are available through the public support and contact pages.",
  },
];

const faqs = [
  {
    question: "Who can use the member portal?",
    answer: "Registered SSF Alparamba Unit members whose mobile number has been added by an authorised administrator.",
  },
  {
    question: "What does the contribution cover?",
    answer: "The applicable amount and contribution rules are published on the Contribution Details page before payment.",
  },
  {
    question: "Are physical goods delivered?",
    answer: "No. This portal does not sell or ship physical goods; the Shipping Policy states this clearly.",
  },
  {
    question: "How can I get help?",
    answer: "Use the Contact page to reach an active committee contact. Only contact details configured by the unit are displayed.",
  },
];

export function ProfessionalPortalSections() {
  return (
    <>
      <section className="border-t border-white/70 bg-white/35 py-12 backdrop-blur-xl md:py-16">
        <div className="container space-y-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm">
              <BookOpenCheck className="size-4" /> About the portal
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Contribution management with clear steps</h2>
            <p className="text-sm font-medium leading-6 text-slate-600 md:text-base">Members can review their details, follow contribution information, and access committee support from one official portal.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {steps.map((step, index) => (
              <Card key={step.title} className="border-white/80 bg-white/65 shadow-[0_8px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <CardHeader className="space-y-3 p-5 pb-3">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-blue-100/80 bg-blue-50/80 text-blue-700">
                    <step.icon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Step {index + 1}</p>
                    <CardTitle className="text-base text-slate-950">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5"><CardDescription className="text-sm leading-6 text-slate-600">{step.description}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/70 bg-white/55 py-12 backdrop-blur-xl md:py-16">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              <ShieldCheck className="size-4" /> Trust & clarity
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Information reviewers and members can verify</h2>
            <p className="text-sm font-medium leading-6 text-slate-600 md:text-base">The public pages explain the portal purpose, contribution rules, service policies, and available support without requiring a login.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 bg-blue-600 text-white hover:bg-blue-700"><Link href="/contribution-details">Contribution details <ArrowRight className="ml-2 size-4" /></Link></Button>
              <Button asChild variant="outline" className="h-11"><Link href="/contact">Contact committee</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {assurances.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white/80 text-slate-700 shadow-sm"><item.icon className="size-5" /></div>
                <div><h3 className="font-bold text-slate-950">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/70 bg-[#eef7ff]/75 py-12 backdrop-blur-xl md:py-16">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm"><CircleHelp className="size-4" /> Common questions</span>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Before you continue</h2>
            <p className="text-sm font-medium leading-6 text-slate-600 md:text-base">Straightforward answers about access, contributions, delivery, and support.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl open:bg-white/85 open:shadow-md">
                <summary className="cursor-pointer list-none pr-8 font-bold text-slate-950 marker:hidden">{faq.question}</summary>
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}