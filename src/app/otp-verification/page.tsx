"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck } from "lucide-react";

function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "your number";
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setIsLoading(true);
    setError("");

    // Mock verification (demo mode: "1234" is valid)
    setTimeout(() => {
      setIsLoading(false);
      if (otp === "1234") {
        setSuccess(true);
        setTimeout(() => {
          router.push("/member/dashboard");
        }, 800);
      } else {
        setError("Invalid OTP. For demo purposes, use '1234'.");
      }
    }, 1000);
  };

  return (
    <Card className="border-0 shadow-lg sm:p-2">
      <CardHeader>
        <CardTitle className="text-2xl">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 4-digit code sent to <span className="font-medium text-foreground">{phone}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-green-600 space-y-3">
            <ShieldCheck className="h-12 w-12" />
            <p className="font-medium">Verification Successful!</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Enter 4-digit OTP"
                className="text-center text-xl tracking-widest h-14"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              {error && (
                <div className="flex items-center space-x-2 text-destructive text-sm mt-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading || otp.length !== 4}>
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>
        )}
      </CardContent>
      {!success && (
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive the code? <button className="text-primary hover:underline font-medium">Resend OTP</button>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function OtpVerificationPage() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo/logo.webp" alt="SSF Logo" className="h-20 w-auto object-contain mb-3" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
          <h1 className="font-cooper text-4xl font-bold text-slate-900 tracking-tight">SSF</h1>
          <p className="text-slate-600 font-medium text-lg mt-1">Alparamba Unit</p>
        </div>
        <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
          <OtpVerificationForm />
        </Suspense>
      </div>
    </div>
  );
}
