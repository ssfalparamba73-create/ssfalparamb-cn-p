"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { TransparentLogo } from "@/components/TransparentLogo";
import { toast } from "sonner";
import { authClient } from "@/lib/frontend-api/authClient";
import { useSession } from "@/lib/auth/SessionContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshSession } = useSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 600);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.every((p) => p !== "")) {
      setIsLoading(true);
      try {
        await authClient.adminLogin(phone, pin.join(""));
        toast.success("Login Successful!");
        await refreshSession();
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 800);
      } catch (err: any) {
        toast.error(err.message || "Invalid Admin PIN");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.24),transparent_24rem),radial-gradient(circle_at_86%_24%,rgba(34,197,94,0.24),transparent_20rem),linear-gradient(135deg,#f8fbff_0%,#eef8ff_48%,#effdf7_100%)]">
      
      {/* Decorative background gradients from landing page */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.16)_1px,transparent_0)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-[72rem] rotate-[-7deg] rounded-[100%] bg-gradient-to-r from-blue-500/30 via-cyan-300/28 to-emerald-300/30 blur-2xl" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-52 w-[58rem] rotate-[15deg] rounded-[100%] bg-white/40 blur-xl" />

      <Card className="w-full max-w-[440px] shadow-xl border-0 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-2 relative z-10">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex flex-col items-center mb-2">
            <TransparentLogo src="/logo/logo-transparent.svg" alt="SSF Logo" className="h-16 w-auto object-contain mb-3 drop-shadow-sm" />
          </div>
          <CardTitle className="text-3xl font-bold">
            <span className="font-cooper text-slate-900">SSF</span> Admin
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium text-base">
            Alparamba Unit
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter admin number"
                    className="pl-12 h-12 text-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={phone.length !== 10 || isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-base text-slate-600 font-medium">Enter 4-Digit Admin PIN</Label>
                  <p className="text-sm text-slate-500 mt-1">For +91 {phone}</p>
                </div>
                <div className="flex justify-center gap-3 sm:gap-4">
                  {pin.map((v, i) => (
                    <Input
                      key={i}
                      id={`pin-${i}`}
                      type="password"
                      inputMode="numeric"
                      className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                      value={v}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      maxLength={1}
                      required
                    />
                  ))}
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-8"
                disabled={pin.some((p) => p === "") || isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Login"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium"
                >
                  Change Mobile Number
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
