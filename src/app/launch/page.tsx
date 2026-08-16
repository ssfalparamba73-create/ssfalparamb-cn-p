import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CreditCard, FileText, House, ReceiptText, UserRound } from "lucide-react";

function PhonePreview() {
  return (
    <div className="relative mx-auto w-[clamp(225px,20vw,335px)] rotate-[2deg] rounded-[3.4rem] border-[9px] border-[#111827] bg-white p-2.5 shadow-[10px_18px_28px_rgba(15,23,42,0.24)]">
      <div className="absolute -right-[18px] top-44 h-24 w-2 rounded-r-full bg-[#111827]" />
      <div className="absolute left-1/2 top-3 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[2.6rem] bg-white">
        <div className="flex items-center justify-between px-5 pb-4 pt-8"><span className="font-cooper text-3xl text-[#2563eb]">SSF</span><span className="flex size-9 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]"><UserRound className="size-5" /></span></div>
        <div className="space-y-4 bg-[#f8fafc] px-4 pb-6 pt-2">
          <div className="flex items-center justify-between rounded-2xl border border-[#e5edf9] bg-[#f0f6ff] p-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]"><UserRound className="size-6" /></span><div><p className="text-[11px] text-slate-600">Member Status</p><p className="text-sm font-bold text-slate-900">Active Member</p></div></div><span className="flex size-9 items-center justify-center rounded-full bg-[#22c55e] text-white"><Check className="size-5" strokeWidth={3} /></span></div>
          <div className="rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] p-5 text-white shadow-lg shadow-blue-200"><CreditCard className="size-7" /><div className="mt-6 flex items-end justify-between"><span className="text-xs font-medium">Payment Card</span><span className="text-xs tracking-widest">4587</span></div></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900">Latest Receipt</p><span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[10px] font-semibold text-[#15803d]">Paid</span></div><div className="mt-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-[#2563eb] text-white"><FileText className="size-5" /></span><div className="flex-1"><p className="text-xs font-semibold text-slate-800">Membership Payment</p><p className="mt-1 text-[10px] text-slate-500">May 20, 2024</p></div><p className="text-sm font-bold text-slate-900">$120.00</p></div><div className="my-4 border-t border-dashed border-slate-200" /><span className="flex items-center justify-between text-xs font-semibold text-[#2563eb]">View Receipt <ArrowRight className="size-4" /></span></div>
        </div>
        <div className="flex items-center justify-around border-t border-slate-100 bg-white px-4 py-4 text-[10px] font-medium"><span className="flex flex-col items-center gap-1 text-[#2563eb]"><House className="size-5" />Home</span><span className="flex flex-col items-center gap-1 text-slate-500"><ReceiptText className="size-5" />Payments</span><span className="flex flex-col items-center gap-1 text-slate-500"><UserRound className="size-5" />Profile</span></div>
      </div>
    </div>
  );
}

export default function LaunchPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <section className="relative mx-auto hidden h-screen max-h-screen max-w-[1720px] items-center overflow-hidden px-[6vw] py-[5vh] md:flex">
        <div className="pointer-events-none absolute -bottom-48 -left-40 size-[500px] rounded-full bg-[#eff6ff]" /><div className="pointer-events-none absolute -right-36 bottom-[-20%] size-[760px] rounded-full bg-[#eff6ff]" />
        <div className="relative z-10 w-[56%]">
          <div className="flex items-end gap-[clamp(0.75rem,1.5vw,1.5rem)]"><Image src="/logo/1.webp" alt="SSF logo" width={120} height={160} className="h-[clamp(4.5rem,9vw,8rem)] w-[clamp(3.5rem,6vw,6rem)] object-contain" priority /><div><p className="font-cooper text-[clamp(3.5rem,6.5vw,7rem)] leading-[0.75] tracking-tight text-[#2563eb]">SSF</p><p className="mt-[clamp(0.75rem,1.5vw,1.25rem)] text-[clamp(1.2rem,2vw,2.4rem)] font-semibold tracking-tight text-[#0f1f42]">Alparamba Unit</p></div></div>
          <h1 className="mt-[clamp(2rem,5vh,4rem)] max-w-[850px] text-[clamp(2.75rem,4.2vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-[#0f1f42]">Our Digital Platform<br />is Launching Soon</h1>
          <p className="mt-[clamp(1.5rem,4vh,2.75rem)] flex flex-wrap items-center gap-x-[clamp(0.65rem,1.2vw,1.25rem)] gap-y-2 text-[clamp(0.85rem,1.35vw,1.65rem)] font-semibold text-[#2563eb]"><span>Secure Payments</span><i className="size-2 rounded-full bg-[#2563eb]" /><span>Member Services</span><i className="size-2 rounded-full bg-[#2563eb]" /><span>Easy Access</span></p>
          <Link href="/" className="mt-[clamp(1.75rem,4vh,3.5rem)] inline-flex rounded-2xl bg-[#1557e8] px-[clamp(2.5rem,4vw,4rem)] py-[clamp(0.75rem,1.5vh,1.25rem)] text-[clamp(1.15rem,1.7vw,1.8rem)] font-bold text-white shadow-[0_12px_22px_rgba(37,99,235,0.28)] transition hover:bg-[#114bd1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">Launch App</Link>
        </div>
        <div className="relative z-10 flex w-[44%] justify-center pt-12"><PhonePreview /></div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-6 text-center md:hidden"><div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="font-cooper text-4xl tracking-wide text-[#2563eb]">SSF</p><h1 className="mt-4 text-xl font-semibold text-slate-900">Open this launch page on a desktop</h1><p className="mt-2 text-sm leading-6 text-slate-500">The launch artwork is designed for desktop screens.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-[#2563eb] px-5 py-3 font-semibold text-white">Open landing page</Link></div></section>
    </main>
  );
}
