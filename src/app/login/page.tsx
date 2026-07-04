"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneIcon, User, ArrowRight, Headset, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    // Simulate API call for sending OTP
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to OTP verification page
      router.push(`/otp-verification?phone=${encodeURIComponent(phone)}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background dots */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#D7E4FF 2px, transparent 2px)',
          backgroundSize: '30px 30px',
          zIndex: -1,
        }}
      />
      {/* Subtle background waves/gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[rgba(255,255,255,0.35)] blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[rgba(255,255,255,0.35)] blur-3xl" />
      </div>

      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo Section */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo/logo.webp" alt="SSF Logo" className="h-20 w-auto object-contain mb-3" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
          <h1 className="font-cooper text-4xl font-bold text-slate-900 tracking-tight">SSF</h1>
          <p className="text-slate-600 font-medium text-lg mt-1">Alparamba Unit</p>
        </div>

        {/* Login Card */}
        <Card className="w-full border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden p-2 sm:p-4">
          <CardContent className="pt-6 px-4 sm:px-6 pb-6">
            
            {/* Avatar Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-[#EEF3FA] rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-[#2563EB]" strokeWidth={1.5} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Welcome Back</h2>
              <p className="text-[15px] text-slate-500">
                Enter your mobile number to securely sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  Mobile Number
                </label>
                <div className="relative group">
                  <PhoneIcon className="absolute left-4 top-3.5 h-5 w-5 text-[#2563EB]" strokeWidth={2} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    className="h-12 text-base bg-transparent border-[#E5EAF3] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2563EB] transition-all rounded-xl text-slate-900 placeholder:text-slate-400"
                    style={{ paddingLeft: "3.25rem" }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center group" 
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Get OTP"}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5EAF3]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">Or</span>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <p className="text-[14px] text-slate-500 flex items-center gap-1.5">
                <Headset className="h-5 w-5 text-[#22C55E]" />
                Having trouble? <a href="#" className="text-[#22C55E] font-semibold hover:underline">Contact Unit Admin</a>
              </p>
            </div>

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
