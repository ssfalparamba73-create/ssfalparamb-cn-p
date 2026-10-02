"use client";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { requestBackend } from "@/lib/api/backendClient"
import { getCurrentMemberProfile } from "@/lib/api/memberClient"
import { getCashReceivers, type CashReceiver } from "@/lib/api/cashReceiverClient"
import { formatDuesPeriod, getDuesMonthKeys, type DuesFrequency } from "@/lib/payments/duesPeriod"

interface PublicPaymentSettings {
  baseTier: number;
  premiumTier: number;
  customMinimum: number;
  duesFrequency: DuesFrequency;
  upiEnabled: boolean;
  specialEventEnabled: boolean;
}

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: { description?: string };
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  prefill: { contact: string };
  theme: { color: string };
};

type RazorpayCheckout = {
  open(): void;
  on(event: "payment.failed", callback: (response: RazorpayFailureResponse) => void): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

function PayNowContent({ source }: { source: string | null }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [admins, setAdmins] = useState<CashReceiver[]>([]);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (source !== "member") return;
    getCurrentMemberProfile()
      .then((profile) => setMemberQuery(profile.phone))
      .catch(() => undefined);
  }, [source]);

  useEffect(() => {
    getCashReceivers().then(setAdmins).catch(() => setAdmins([]));
  }, []);

  // Preload receipt images in the background without causing lag
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadImages = () => {
      const images = ["/recept.svg", "/logo/atiyya-logo-icon.png"];
      images.forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    };

    // requestIdleCallback ensures this only runs when the browser is completely free
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadImages);
    } else {
      setTimeout(preloadImages, 2500);
    }
  }, []);

  // New states for Support & Events
  const [activeTab, setActiveTab] = useState<"subscriptions" | "event">("subscriptions");
  const [paymentSettings, setPaymentSettings] = useState<PublicPaymentSettings>({ baseTier: 50, premiumTier: 100, customMinimum: 10, duesFrequency: "monthly", upiEnabled: true, specialEventEnabled: false });
  const isUpiAvailable = paymentSettings.upiEnabled ?? true;
  const [duesTier, setDuesTier] = useState<number>(50);

  // Fetch dynamic payment settings from admin panel configuration
  useEffect(() => {
    fetch("/api/v1/settings/payments", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setPaymentSettings(data.data);
          // Only update duesTier to the new base if they haven't manually changed it,
          // or if they are currently on the old default '50'
          setDuesTier((prev) => (prev === 50 ? data.data.baseTier : prev));
        }
      })
      .catch(() => {});
  }, []);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [checkoutHint, setCheckoutHint] = useState<string | null>(null);

  // Special events remain available only through configured event support.
  const isSpecialEventActive = paymentSettings.specialEventEnabled ?? false;
  const effectivePaymentMethod = !isUpiAvailable && paymentMethod === "upi" ? "cash" : paymentMethod;
  const effectiveActiveTab = !isSpecialEventActive && activeTab === "event" ? "subscriptions" : activeTab;

  const selectedMonths = getDuesMonthKeys(paymentSettings.duesFrequency);
  const currentContributionPeriod = formatDuesPeriod(selectedMonths);

  let finalAmount = 0;
  if (effectiveActiveTab === "subscriptions") {
    finalAmount = duesTier;
  } else {
    finalAmount = parseInt(customAmount) || 0;
  }

  const isButtonDisabled =
    !memberQuery.trim() ||
    (effectivePaymentMethod === "cash" && !selectedAdmin) ||
    (effectiveActiveTab === "subscriptions" && selectedMonths.length === 0) ||
    (effectiveActiveTab === "event" && finalAmount < paymentSettings.customMinimum);

  const selectedAdminName = admins.find((admin) => admin.id === selectedAdmin)?.name || "";

  const handleRazorpayCheckout = async () => {
    if (isButtonDisabled) {
      setCheckoutHint("Enter your phone number or member ID above to continue with Digital Payment.");
      return;
    }
    setCheckoutHint(null);
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create intent
      const intent = await requestBackend<{ paymentId: string; paymentUpdatedAt?: string; receiptId?: string; receiptAccessToken?: string; amount: number }>("/api/v1/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          memberQuery,
          payerName: memberQuery,
          payerPhone: memberQuery,
          category: effectiveActiveTab === "event" ? "special_event" : "monthly_dues",
          method: "upi",
          selectedMonthIds: effectiveActiveTab === "subscriptions" ? selectedMonths : undefined,
          tier: effectiveActiveTab === "subscriptions" ? (duesTier === paymentSettings.baseTier ? "base" : "premium") : "custom",
          customAmount: effectiveActiveTab === "event" ? finalAmount : undefined,
        }),
      });

      if (!intent.receiptId || !intent.receiptAccessToken) {
        throw new Error("Secure receipt access could not be prepared. Please try again.");
      }
      if (!intent.paymentUpdatedAt) {
        throw new Error("Payment details could not be verified. Please try again.");
      }
      sessionStorage.setItem(`receipt-access:${intent.paymentId}`, JSON.stringify({
        receiptId: intent.receiptId,
        token: intent.receiptAccessToken,
      }));

      // 2. Create Razorpay order mapping to intent
      const orderRes = await fetch("/api/v1/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: intent.paymentId, paymentUpdatedAt: intent.paymentUpdatedAt })
      });
      const orderData = await orderRes.json() as { id: string; amount: number; currency: string; keyId: string; error?: string };
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
      if (typeof window.Razorpay !== "function") throw new Error("Razorpay checkout could not be loaded. Please try again.");

      // 3. Open modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Atiyya Group",
        description: "Educational Subscription",
        order_id: orderData.id,
        handler: async function (response: RazorpayCheckoutResponse) {
          try {
            // Finish server verification and receipt creation before opening the receipt page.
            const verifyResponse = await fetch("/api/v1/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: intent.paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            if (!verifyResponse.ok && verifyResponse.status !== 202) {
              setCheckoutHint("Payment was received. Confirmation is still pending; your receipt will appear once it completes.");
            }
          } catch (error) {
            setCheckoutHint(error instanceof Error ? error.message : "Payment confirmation is pending.");
          } finally {
            // If verification is temporarily unavailable, the receipt page safely waits for webhook reconciliation.
            router.push(`/success?paymentId=${encodeURIComponent(intent.paymentId)}&receiptId=${encodeURIComponent(intent.receiptId!)}`);
          }
        },
        prefill: {
          contact: memberQuery,
        },
        theme: { color: "#0f172a" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      setPaymentError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };



  const handleCashHandover = async () => {
    if (isButtonDisabled) {
      setCheckoutHint("Enter your phone number and select the admin receiving the cash.");
      return;
    }

    setCheckoutHint(null);
    try {
      const intent = await requestBackend<{ paymentId: string; amount: number }>("/api/v1/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          memberQuery,
          payerName: memberQuery,
          payerPhone: memberQuery,
          category: effectiveActiveTab === "event" ? "special_event" : "monthly_dues",
          method: "cash_handover",
          selectedMonthIds: effectiveActiveTab === "subscriptions" ? selectedMonths : undefined,
          tier: effectiveActiveTab === "subscriptions" ? (duesTier === paymentSettings.baseTier ? "base" : "premium") : "custom",
          customAmount: effectiveActiveTab === "event" ? finalAmount : undefined,
          receivedByAdminId: selectedAdmin,
        }),
      });

      router.push(`/success?method=cash_handover&admin=${encodeURIComponent(selectedAdminName)}&phone=${encodeURIComponent(memberQuery)}&amount=${intent.amount}${effectiveActiveTab === 'event' ? '&category=special_event' : ''}${source === 'member' ? '&source=member' : ''}&paymentId=${intent.paymentId}`);
    } catch (error) {
      setCheckoutHint(error instanceof Error ? error.message : "Unable to record the cash handover.");
    }
  };

  // Removed old isButtonDisabled

  return (
    <div className="min-h-[100svh] bg-secondary/50 px-3 py-3 transition-colors duration-300 dark:bg-slate-900 sm:px-4 lg:h-[100svh] lg:min-h-[680px] lg:overflow-hidden lg:p-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 lg:h-full lg:gap-3">
        <Link href={source === "member" ? "/member/dashboard" : "/"} className="inline-flex w-fit items-center text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm">
          <ArrowLeft className="mr-2 size-4" /> {source === "member" ? "Back to Dashboard" : "Back to Home"}
        </Link>

        <div className="flex items-center justify-center gap-3 text-center md:justify-between md:text-left">
          <div className="flex items-center gap-3 md:gap-4">
            <Image src="/logo/atiyya-logo-icon.png" alt="Atiyya Logo" width={44} height={44} className="h-10 w-10 object-contain md:h-12 md:w-12" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground dark:text-slate-50 md:text-2xl">
                <span className="font-sans font-bold">Atiyya</span> Alparamba Unit
              </h1>
              <p className="text-xs text-muted-foreground md:text-sm">Secure contribution checkout</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 shadow-sm dark:border-green-900 dark:bg-slate-900 dark:text-green-400 lg:flex">
            <ShieldCheck className="size-4" /> Secure Razorpay Checkout
          </div>
        </div>

        <Card className="border-0 bg-transparent shadow-none lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-primary/10 lg:bg-card lg:shadow-lg">
          <CardHeader className="space-y-0 px-0 pb-2 pt-1 lg:px-5 lg:pt-4">
                  <CardTitle className="text-base md:text-xl">Payment Details</CardTitle>
                  <CardDescription className="hidden lg:block">Confirm the member and contribution period before continuing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-6 lg:space-y-0 lg:overflow-hidden lg:px-5 lg:pb-5">
            <div className="space-y-3 lg:min-w-0 lg:overflow-y-auto lg:pr-1">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number or Member ID</Label>
              <Input
                id="phone"
                placeholder="Enter your 10 digit number"
                type="tel"
                className="bg-white dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-50 dark:focus-visible:ring-blue-500/30 dark:focus-visible:border-blue-500/50"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
              />
              {!memberQuery.trim() && (
                <p className="text-xs text-amber-700 dark:text-amber-300">Enter your phone number or member ID to enable payment.</p>
              )}
            </div>

            {/* Category Tabs */}
            <div className="bg-secondary/50 p-1 rounded-xl flex items-center mb-2 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("subscriptions")}
              className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${effectiveActiveTab === "subscriptions" ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"}`}
              >
                Contribution
              </button>
              {isSpecialEventActive && (
                <button
                  type="button"
                  onClick={() => setActiveTab("event")}
                  className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${effectiveActiveTab === "event" ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"}`}
                >
                  Special Event
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {effectiveActiveTab === "subscriptions" ? (
                <div className="space-y-3 md:space-y-4 lg:rounded-xl lg:border lg:bg-accent/30 lg:p-4 dark:lg:bg-slate-800/50 dark:lg:border-slate-700">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contribution Period</Label>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 lg:rounded-lg lg:border lg:border-primary/30 lg:bg-white lg:px-3 lg:py-2.5 lg:dark:border-blue-500/50 lg:dark:bg-slate-800">
                      {currentContributionPeriod}
                      <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">Selected tier amount covers this full period.</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Membership Tier · Per Period</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setDuesTier(paymentSettings.baseTier)} className={`min-h-14 rounded-xl border px-2 py-2 flex flex-col items-center justify-center gap-0.5 transition-all md:min-h-16 ${duesTier === paymentSettings.baseTier ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-base leading-none md:text-lg">₹{paymentSettings.baseTier}</span>
                        <span className="text-[9px] uppercase tracking-wider">Base</span>
                      </button>
                      <button type="button" onClick={() => setDuesTier(paymentSettings.premiumTier)} className={`min-h-14 rounded-xl border px-2 py-2 flex flex-col items-center justify-center gap-0.5 transition-all md:min-h-16 ${duesTier === paymentSettings.premiumTier ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-base leading-none md:text-lg">₹{paymentSettings.premiumTier}</span>
                        <span className="text-[9px] uppercase tracking-wider">Premium</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex justify-between items-baseline dark:border-slate-700 lg:hidden">
                    <span className="text-slate-500 font-medium">Total Support</span>
                    <span className="font-bold text-2xl text-slate-900 dark:text-slate-50">₹{finalAmount}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-accent/30 p-4 space-y-4 dark:bg-slate-800/50 dark:border-slate-700">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700/30">
                    <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 mt-0.5 dark:bg-amber-900/50 dark:text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Special Event Payment</h4>
                      <p className="text-xs text-amber-700/80 mt-0.5 leading-snug dark:text-amber-200/70">Review the approved event details and applicable amount before continuing.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enter Custom Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">₹</span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-9 h-14 text-lg font-bold bg-white dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-50 dark:focus-visible:ring-blue-500/30 dark:focus-visible:border-blue-500/50"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min={paymentSettings.customMinimum}
                      />
                    </div>
                    {effectiveActiveTab === "event" && finalAmount > 0 && finalAmount < paymentSettings.customMinimum && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3" /> Minimum amount is ₹{paymentSettings.customMinimum}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            </div>
            <div className="space-y-3 lg:min-w-0 lg:overflow-y-auto lg:border-l lg:border-border lg:pl-5">
            <div className="hidden rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10 lg:block">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Payment Summary</p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Member</dt><dd className="max-w-[62%] truncate text-right font-semibold text-slate-900 dark:text-slate-50">{memberQuery.trim() || "Enter member details"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Period</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-50">{effectiveActiveTab === "subscriptions" ? currentContributionPeriod : "Approved event"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Payment Purpose</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-50">{effectiveActiveTab === "event" ? "Special Event" : "Educational Subscription"}</dd></div>
                <div className="flex items-center justify-between gap-4 border-t border-blue-100 pt-2 dark:border-blue-500/20"><dt className="font-semibold text-slate-700 dark:text-slate-300">Amount</dt><dd className="text-right text-lg font-bold text-slate-950 dark:text-slate-50">₹{finalAmount || 0}</dd></div>
              </dl>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-12 flex flex-row gap-2 transition-all lg:h-14 lg:flex-col lg:gap-1 ${effectivePaymentMethod === "upi" ? "border-primary bg-primary/5 text-primary dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50" : "text-muted-foreground hover:text-foreground dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"} ${!isUpiAvailable ? "cursor-not-allowed opacity-60" : ""}`}
                  onClick={() => setPaymentMethod("upi")}
                  disabled={!isUpiAvailable}
                >
                  <CreditCard className="size-5" />
                  <span className="text-xs">{isUpiAvailable ? "Online Payment" : "Online Unavailable"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-12 flex flex-row gap-2 transition-all lg:h-14 lg:flex-col lg:gap-1 ${effectivePaymentMethod === "cash" ? "border-primary bg-primary/5 text-primary dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50" : "text-muted-foreground hover:text-foreground dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"}`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="size-5" />
                  <span className="text-xs">Cash Handover</span>
                </Button>
              </div>

              {!isUpiAvailable && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Digital payments are temporarily unavailable. Please use Cash Handover for now.
                </div>
              )}

              {/* Razorpay offers the supported instruments within its hosted checkout. */}
              {effectivePaymentMethod === "upi" && isUpiAvailable && (
                <div className="hidden rounded-xl border bg-secondary/30 p-3 dark:bg-slate-800/50 dark:border-slate-700 lg:block">
                  <p className="text-sm font-semibold text-foreground">Pay securely with Razorpay</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Available options appear in the secure checkout.</p>
                </div>
              )}

              {/* Cash Handover Options (Admin Dropdown) */}
              {effectivePaymentMethod === "cash" && (
                <div className="mt-4 p-4 rounded-xl border bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 relative dark:bg-slate-800/50 dark:border-slate-700">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Received By
                  </Label>

                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5EAF3] bg-background px-4 py-2 text-base text-left transition-all hover:bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                      onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    >
                      <span className={selectedAdmin ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {selectedAdmin
                          ? selectedAdminName
                          : "Select Admin"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isAdminDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isAdminDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setIsAdminDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-2 z-30 max-h-40 overflow-auto rounded-xl border border-[#E5EAF3] bg-white p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 dark:border-slate-700 dark:bg-slate-800">
                          {admins.map((admin) => (
                            <button
                              key={admin.id}
                              type="button"
                              className={`w-full text-left px-4 py-1.5 rounded-lg transition-colors flex flex-col ${
                                selectedAdmin === admin.id
                                  ? "bg-primary/10 text-primary font-medium dark:bg-blue-500/15 dark:text-blue-400"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                              }`}
                              onClick={() => {
                                setSelectedAdmin(admin.id);
                                setIsAdminDropdownOpen(false);
                              }}
                            >
                              <span className="font-semibold text-[14px] leading-tight">{admin.name}</span>
                              <span className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">Cash Receiver</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {paymentError && (
              <div className="flex flex-col gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 w-full animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-2.5 w-full">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed break-words flex-1">{paymentError}</span>
                </div>
                <div className="flex items-center gap-3 pl-7 flex-wrap mt-1">
                  <Link href="/support" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/80 px-3.5 py-2 rounded-lg border border-destructive/20 hover:bg-white transition-colors text-destructive shadow-sm">
                    View Contacts
                  </Link>
                  <Link href="/support" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#25D366]/10 px-3.5 py-2 rounded-lg border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-green-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.2-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.4 0-.5C10 9 9.3 7.6 9 7c-.1-.4-.3-.3-.5-.3h-.4c-.2 0-.5.1-.7.3-.3.3-.8.8-.8 2s.8 2.3 1 2.5c.2.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.6.4.1.8.1 1.2.1.8-.1 1.6-.6 1.9-1.2.3-.6.3-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
                      <path fillRule="evenodd" d="M12.2 3C7.2 3 3.1 7.1 3.1 12c0 1.6.4 3.1 1.1 4.4L3 21l4.8-1.2c1.3.6 2.7 1 4.3 1 5 0 9.1-4.1 9.1-9.1S17.2 3 12.2 3zm0 16.2c-1.4 0-2.7-.4-3.9-1l-.3-.2-2.9.7.8-2.8-.2-.3c-.7-1.2-1.1-2.5-1.1-3.9 0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z" clipRule="evenodd" />
                    </svg>
                    WhatsApp Admin
                  </Link>
                </div>
              </div>
            )}

            {checkoutHint && !paymentError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {checkoutHint}
              </div>
            )}
            </div>
          </CardContent>
          <CardFooter className="flex-col items-center gap-2 px-0 pb-0 pt-3 lg:px-5 lg:pb-4 lg:pt-0">
            {effectivePaymentMethod === "upi" ? (
              <Button
                size="lg"
                className="w-full max-w-md text-base h-12 rounded-xl lg:text-lg lg:h-12"
                disabled={isButtonDisabled || isProcessing}
                onClick={handleRazorpayCheckout}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Continue to Online Payment · ₹${finalAmount || 0}`
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full max-w-md text-base h-12 rounded-xl lg:text-lg lg:h-12"
                disabled={isButtonDisabled}
                onClick={handleCashHandover}
              >
                Record ₹{finalAmount || 0} Cash Payment
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-medium md:text-xs">
              <ShieldCheck className="size-4 text-green-600" /> Secure SSL Encrypted Transaction
            </p>
          </CardFooter>
        </Card>
      </div>

    </div>
  )
}

export default function PayNowClient({ source }: { source: string | null }) {
  return <PayNowContent source={source} />;
}
