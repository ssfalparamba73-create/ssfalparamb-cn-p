import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { InlineLoginForm } from "@/components/auth/InlineLoginForm";
import { TransparentLogo } from "@/components/TransparentLogo";

interface LoginPageProps {
  searchParams: Promise<{ phone?: string | string[] }>;
}

function getInitialPhone(phoneParam: string | string[] | undefined): string {
  const value = Array.isArray(phoneParam) ? phoneParam[0] : phoneParam;
  if (!value) return "";

  const phone = value.replace(/\D/g, "").slice(0, 15);
  return /^\d{7,15}$/.test(phone) ? phone : "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { phone } = await searchParams;
  const initialPhone = getInitialPhone(phone);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.24),transparent_24rem),radial-gradient(circle_at_86%_24%,rgba(34,197,94,0.24),transparent_20rem),linear-gradient(135deg,#f8fbff_0%,#eef8ff_48%,#effdf7_100%)]">
      
      {/* Decorative background gradients from landing page */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.16)_1px,transparent_0)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-[72rem] rotate-[-7deg] rounded-[100%] bg-gradient-to-r from-blue-500/30 via-cyan-300/28 to-emerald-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-52 w-[58rem] rotate-[15deg] rounded-[100%] bg-white/40 blur-xl" />

      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8 flex flex-col items-center">
          <TransparentLogo src="/logo/logo-transparent.svg" alt="SSF Logo" className="h-16 w-auto object-contain mb-3 drop-shadow-sm" />
          <h1 className="font-cooper text-4xl font-bold text-slate-900 tracking-tight">SSF</h1>
          <p className="text-slate-900 font-bold text-lg mt-1">Alparamba Unit</p>
        </div>

        {/* Login Card */}
        <Card className="w-full border-0 shadow-xl bg-white rounded-[2.5rem] overflow-hidden p-4 sm:p-6 transition-all duration-300">
          <CardContent className="pt-4 px-2 sm:px-4 pb-4">
            
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-[#EEF3FA] rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-[#2563EB]" strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Welcome Back</h2>
              <p className="text-[15px] text-slate-500">
                Enter your mobile number to securely sign in.
              </p>
            </div>

            <InlineLoginForm isGlass={false} initialPhone={initialPhone} />

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <p className="text-[13px] text-slate-500">
            © 2025 SSF Alparamba Unit. All rights reserved.
          </p>
          <div className="bg-[#EEF3FA] px-4 py-1.5 rounded-full flex items-center gap-2 border border-[#E5EAF3]">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" strokeWidth={2} />
            <span className="text-[12px] font-medium text-[#2563EB]">Secure • Trusted • Private</span>
          </div>
        </div>

      </div>
    </div>
  );
}
