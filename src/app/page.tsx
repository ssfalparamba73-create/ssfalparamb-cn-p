import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Droplet,
  LockKeyhole,
  Phone,
  Send,
  ShieldCheck,
  SmartphoneNfc,
  Sparkles,
  Users,
  Zap,
  ArrowRight
} from "lucide-react"
import dynamic from "next/dynamic"

const InteractiveBenefits = dynamic(() => import("@/components/landing/InteractiveBenefits").then(m => m.InteractiveBenefits))
import { Header } from "@/components/layout/Header"
import { TransparentLogo } from "@/components/TransparentLogo"
import { InlineLoginForm } from "@/components/auth/InlineLoginForm"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[#eef7ff] text-slate-950 selection:bg-cyan-100 selection:text-blue-950">
      <Header />

      <main className="flex-1 flex flex-col bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.24),transparent_24rem),radial-gradient(circle_at_86%_24%,rgba(34,197,94,0.24),transparent_20rem),linear-gradient(135deg,#f8fbff_0%,#eef8ff_48%,#effdf7_100%)]">
        {/* Hero Section */}
        <section className="relative grid md:min-h-[calc(100vh-5rem)] py-8 md:py-0 grid-cols-1 overflow-hidden lg:grid-cols-2">
          <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.16)_1px,transparent_0)] [background-size:34px_34px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-[72rem] rotate-[-7deg] rounded-[100%] bg-gradient-to-r from-blue-500/30 via-cyan-300/28 to-emerald-300/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-[58rem] rotate-[-15deg] rounded-[100%] bg-white/40 blur-xl" />
          <div className="pointer-events-none absolute -right-28 top-24 h-64 w-64 rounded-full bg-emerald-400/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[31rem] w-[19rem] opacity-30">
            <div className="absolute bottom-0 left-8 h-72 w-24 rounded-t-full border border-blue-300/30 bg-gradient-to-b from-white/50 to-blue-200/45 blur-[1px]" />
            <div className="absolute bottom-72 left-17 h-14 w-4 rounded-full bg-blue-300/35" />
            <div className="absolute bottom-84 left-15 h-9 w-9 rounded-full border-l-4 border-blue-300/40" />
            <div className="absolute bottom-0 left-0 h-36 w-40 rounded-t-full border border-blue-300/25 bg-blue-200/35" />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-white/10 backdrop-blur-sm" />

          {/* Left Column: Brand & Value */}
          <div className="relative z-10 flex flex-col justify-center overflow-hidden px-4 py-6 md:px-12 lg:px-20 md:py-16 text-center md:text-left items-center md:items-start">
            <div 
              className="relative z-10 w-full max-w-xl space-y-6 md:space-y-8 p-2 sm:p-8 mt-2 md:mt-0 flex flex-col items-center md:items-start animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both"
            >
              
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/70 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-extrabold uppercase tracking-[0.15em] text-blue-700 shadow-sm backdrop-blur-xl">
                <ShieldCheck className="size-3 md:size-4" /> Official Platform
              </div>

              <h1 className="text-[2.5rem] leading-[1.1] font-black tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                <span className="hidden md:inline">Member <br /></span>
                <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">Contribution</span> <br className="hidden md:block" />
                Portal.
              </h1>

              <div className="h-1 w-16 md:w-20 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

              <p className="max-w-md text-base md:text-lg font-medium leading-relaxed text-slate-600">
                Welcome to SSF Alparamba. Uniting our community digitally and empowering members with a seamless, transparent experience.
              </p>

              {/* Mobile CTA (Hidden on desktop) */}
              <div className="lg:hidden pt-8 w-full flex justify-center">
                <Link href="/login" className="block w-full max-w-sm group">
                  <Button size="lg" className="h-14 w-full rounded-full bg-slate-950 hover:bg-slate-900 text-base font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] transition-all flex items-center justify-center gap-2">
                    Access Portal
                    <ArrowRight className="size-4 opacity-80 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

            </div>
          </div>

          {/* Right Column: Login/Signup Form */}
          <div className="relative z-10 hidden lg:flex items-center justify-center pt-8 pb-0 px-20 w-full">
            <div 
              className="relative z-10 w-full max-w-[420px] shrink-0 self-center animate-in fade-in zoom-in-95 duration-700 delay-200 ease-out fill-mode-both"
            >
              <div id="login-card" className="relative rounded-[2.5rem] border border-white/60 bg-white/40 p-6 shadow-[0_32px_80px_rgba(37,99,235,0.12)] backdrop-blur-3xl sm:p-8">
                
                {/* User Avatar Group */}
                <div className="mb-8 flex justify-center">
                  <div className="flex -space-x-4">
                    <img className="inline-block size-12 rounded-full border-2 border-white object-cover shadow-sm" src="https://i.pravatar.cc/100?img=1" alt="" />
                    <img className="inline-block size-12 rounded-full border-2 border-white object-cover shadow-sm" src="https://i.pravatar.cc/100?img=2" alt="" />
                    <img className="inline-block size-12 rounded-full border-2 border-white object-cover shadow-sm" src="https://i.pravatar.cc/100?img=3" alt="" />
                    <div className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-600 shadow-sm">+99</div>
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-950">Join SSF <br/> Alparamba Unit</h2>
                  <p className="mx-auto max-w-xs text-sm font-medium leading-6 text-slate-500">Enter your 10-digit mobile number to sign up or log in to your account.</p>
                </div>

                <div className="mt-7">
                  <InlineLoginForm isGlass={true} />
                </div>

                <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs font-semibold leading-6 text-slate-500">
                  <LockKeyhole className="mt-1 size-4 shrink-0 text-slate-400" />
                  <span>By continuing, you agree to the community guidelines and privacy policy.</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Member Benefits Section */}
        <section className="relative border-t border-white/60 bg-white/60 py-20 backdrop-blur-2xl md:py-28 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.14),transparent_24rem),radial-gradient(circle_at_78%_36%,rgba(16,185,129,0.16),transparent_22rem)]" />
          <div className="container relative space-y-16">
            <div 
              className="mx-auto max-w-2xl space-y-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both"
            >
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/65 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700 shadow-sm backdrop-blur-xl">
                <Sparkles className="size-4" />
                Member Benefits
              </div>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950">Why use the portal?</h2>
              <p className="text-lg font-medium text-slate-500">Designed exclusively for our members to stay connected and updated.</p>
            </div>

            <InteractiveBenefits />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/70 bg-white/70 py-10 backdrop-blur-2xl">
        <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <TransparentLogo src="/logo/logo.webp" alt="SSF Logo" className="h-8 w-auto object-contain opacity-90 drop-shadow-sm" />
            <span className="text-sm font-bold text-slate-500">
              <span className="font-cooper font-normal text-slate-700">SSF</span> Alparamba Unit
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            © {new Date().getFullYear()} SSF Alparamba. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
