"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { PhoneIcon, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loginMember } from "@/lib/api/authClient";

interface InlineLoginFormProps {
  isGlass?: boolean; // To match the desktop hero section style
  initialPhone?: string;
}

function normalizePhoneInput(input: string): string {
  let value = input.replace(/\D/g, "");

  if (value.length >= 12 && value.startsWith("91")) {
    value = value.slice(2);
  } else if (value.length >= 14 && value.startsWith("0091")) {
    value = value.slice(4);
  }

  return value.slice(0, 15);
}

export function InlineLoginForm({ isGlass = false, initialPhone = "" }: InlineLoginFormProps) {
  const router = useRouter();
  const invitedPhone = normalizePhoneInput(initialPhone);
  const hasInvitedPhone = /^\d{7,15}$/.test(invitedPhone);

  // State
  const [step, setStep] = useState<"phone" | "otp">(hasInvitedPhone ? "otp" : "phone");
  const [phone, setPhone] = useState(hasInvitedPhone ? invitedPhone : "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(normalizePhoneInput(e.target.value));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPhone(normalizePhoneInput(e.clipboardData.getData("text/plain")));
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 4).replace(/\D/g, "");
      setOtp(pasted);
      if (pasted.length === 4) {
        inputRefs.current[3]?.focus();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
      return;
    }

    if (value && !/^\d$/.test(value)) return; // Only numbers

    const newOtp = otp.split("");
    // Pad array if needed when jumping ahead (though disabled via logic)
    while (newOtp.length < 4) newOtp.push("");

    newOtp[index] = value;
    const combined = newOtp.join("").substring(0, 4);
    setOtp(combined);

    // Auto focus next
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Auto focus previous on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
      const newOtp = otp.split("");
      newOtp[index - 1] = "";
      setOtp(newOtp.join(""));
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    // Simulate moving to next step
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 500);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);

    try {
      const session = await loginMember(phone, otp);
      toast.success("Verification Successful!");
      router.push(session.profileComplete ? "/member/dashboard" : "/member/complete-profile");
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Invalid Code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles based on whether it's in the hero (glass) or login page (clean)
  const inputClass = isGlass
    ? "h-14 w-full rounded-2xl border border-slate-200/90 bg-white/70 py-4 pr-4 text-lg font-bold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_30px_rgba(15,23,42,0.06)] outline-none placeholder:text-slate-300 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
    : "h-12 text-base bg-transparent border-[#E5EAF3] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2563EB] transition-all rounded-xl text-slate-900 placeholder:text-slate-400";

  const btnClass = isGlass
    ? "h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-lg font-black text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_58px_rgba(16,185,129,0.28)] flex items-center justify-center group"
    : "w-full h-12 text-base font-semibold rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center group";

  return (
    <>
      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className={isGlass ? "mt-7 space-y-5" : "space-y-6"}>
          <div className={isGlass ? "space-y-3" : "space-y-2"}>
            <label htmlFor="phone" className={isGlass ? "block text-sm font-extrabold text-slate-700" : "text-[11px] font-bold uppercase tracking-wider text-[#2563EB]"}>
              Mobile Number
            </label>
            <div className="relative flex items-center group">
              <PhoneIcon className={`absolute pointer-events-none ${isGlass ? 'left-5 size-5 text-slate-400' : 'left-4 top-3.5 h-5 w-5 text-[#2563EB]'}`} strokeWidth={isGlass ? 2.5 : 2} />

              <div className={`absolute flex items-center pointer-events-none ${isGlass ? 'left-13 text-lg font-bold text-slate-400' : 'left-12 text-base font-bold text-slate-500'}`}>
                +91
              </div>

              <input
                id="phone"
                type="tel"
                placeholder={isGlass ? "98765 43210" : "Enter mobile number"}
                className={inputClass}
                style={{ paddingLeft: isGlass ? "6.25rem" : "5.5rem" }}
                maxLength={15}
                value={phone}
                onChange={handlePhoneChange}
                onPaste={handlePhonePaste}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={btnClass}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : isGlass ? (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      ) : (
        // OTP STEP
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep("phone")}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Enter PIN</h2>
                <p className="text-sm text-slate-500">
                  Enter the 4-digit code provided by the admin for <span className="font-bold text-slate-900">+91 {phone}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className={isGlass ? "block text-sm font-extrabold text-slate-700" : "text-[11px] font-bold uppercase tracking-wider text-[#2563EB]"}>
                    4-Digit PIN
                  </Label>
                  <div className="flex justify-center gap-3 sm:gap-4 mt-4 mb-2" onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text/plain").slice(0, 4).replace(/\D/g, "");
                    setOtp(pasted);
                    if (pasted.length === 4) inputRefs.current[3]?.focus();
                  }}>
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`${isGlass
                          ? "h-14 w-14 sm:w-16 rounded-2xl border border-slate-200/90 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_30px_rgba(15,23,42,0.06)] outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/15 text-slate-950"
                          : "h-12 w-12 sm:w-14 rounded-xl border border-[#E5EAF3] bg-transparent focus-visible:ring-0 focus-visible:border-[#2563EB] text-slate-900"}
                          text-center text-xl sm:text-2xl font-black transition-all`}
                        value={otp[index] || ""}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        disabled={isLoading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className={btnClass}
                  disabled={isLoading || otp.length !== 4}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <div className="mt-6 text-center pt-4">
                <p className="text-sm text-slate-500">
                  Forgot your PIN? <button type="button" onClick={() => router.push("/support")} className="text-blue-600 hover:underline font-semibold ml-1">Contact Admin</button>
                </p>
              </div>
        </div>
      )}
    </>
  );
}
