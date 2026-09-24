"use client";

import { useState, Suspense, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Smartphone, QrCode, ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

import { requestBackend } from "@/lib/api/backendClient"
import { getCurrentMemberProfile } from "@/lib/api/memberClient"
import { getCashReceivers, type CashReceiver } from "@/lib/api/cashReceiverClient"

const isUpiAvailable = true;

function PayNowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const source = searchParams.get("source");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">(
    isUpiAvailable ? "upi" : "cash"
  );
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [showQrModal] = useState(false);
  const setShowQrModal = (_open: boolean) => undefined;
  const isQrInlineOpen = false;
  const renderMockQrCode = () => null;
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [admins, setAdmins] = useState<CashReceiver[]>([]);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfreeError, setCashfreeError] = useState<string | null>(null);

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
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["current"]);
  const [paymentSettings, setPaymentSettings] = useState({ baseTier: 50, premiumTier: 100, customMinimum: 10 });
  const [duesTier, setDuesTier] = useState<number>(50);

  // Fetch dynamic payment settings from admin panel configuration
  useEffect(() => {
    fetch("/api/v1/settings/payments")
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
  const isSpecialEventActive = true;
  const currentContributionPeriod = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date());

  let finalAmount = 0;
  if (activeTab === "subscriptions") {
    finalAmount = selectedMonths.length * duesTier;
  } else {
    finalAmount = parseInt(customAmount) || 0;
  }

  const isButtonDisabled =
    !memberQuery.trim() ||
    (paymentMethod === "upi" && !isUpiAvailable) ||
    (paymentMethod === "cash" && !selectedAdmin) ||
    (activeTab === "subscriptions" && selectedMonths.length === 0) ||
    (activeTab === "event" && finalAmount < paymentSettings.customMinimum);

  const selectedAdminName = admins.find((admin) => admin.id === selectedAdmin)?.name || "";

  const handleQrClick = () => {
    void handleRazorpayCheckout();
  };

  const handleRazorpayCheckout = async () => {
    if (isButtonDisabled) {
      setCheckoutHint("Enter your phone number or member ID above to continue with Digital Payment.");
      return;
    }
    setCheckoutHint(null);
    setIsProcessing(true);
    setCashfreeError(null);

    try {
      // 1. Create intent
      const intent = await requestBackend<{ paymentId: string; amount: number }>("/api/v1/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          memberQuery,
          payerName: memberQuery,
          payerPhone: memberQuery,
          category: activeTab === "event" ? "special_event" : "monthly_dues",
          method: "upi",
          selectedMonthIds: activeTab === "subscriptions" ? selectedMonths : undefined,
          tier: activeTab === "subscriptions" ? (duesTier === paymentSettings.baseTier ? "base" : "premium") : "custom",
          customAmount: activeTab === "event" ? finalAmount : undefined,
        }),
      });

      // 2. Create Razorpay order mapping to intent
      const orderRes = await fetch("/api/v1/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: intent.amount, paymentId: intent.paymentId })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 3. Open modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Atiyya Group",
        description: "Educational Subscription",
        order_id: orderData.id,
        handler: async function (response: any) {
          // Navigate immediately — user sees skeleton receipt right away
          router.push("/success?paymentId=" + intent.paymentId);
          // Fire-and-forget: verify + receipt generation happens in background
          fetch("/api/v1/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: intent.paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            })
          }).catch(() => {/* background — errors handled on success page */});
        },
        prefill: {
          contact: memberQuery,
        },
        theme: { color: "#0f172a" }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setCashfreeError(response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setCashfreeError(err.message || "Something went wrong.");
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
          category: activeTab === "event" ? "special_event" : "monthly_dues",
          method: "cash_handover",
          selectedMonthIds: activeTab === "subscriptions" ? selectedMonths : undefined,
          tier: activeTab === "subscriptions" ? (duesTier === paymentSettings.baseTier ? "base" : "premium") : "custom",
          customAmount: activeTab === "event" ? finalAmount : undefined,
          receivedByAdminId: selectedAdmin,
        }),
      });

      router.push(`/success?method=cash_handover&admin=${encodeURIComponent(selectedAdminName)}&phone=${encodeURIComponent(memberQuery)}&amount=${intent.amount}${activeTab === 'event' ? '&category=special_event' : ''}${source === 'member' ? '&source=member' : ''}&paymentId=${intent.paymentId}`);
    } catch (error) {
      setCheckoutHint(error instanceof Error ? error.message : "Unable to record the cash handover.");
    }
  };

  // Removed old isButtonDisabled

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12 relative transition-colors duration-300 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6">
        <Link href={source === "member" ? "/member/dashboard" : "/"} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> {source === "member" ? "Back to Dashboard" : "Back to Home"}
        </Link>

        <div className="text-center space-y-2 flex flex-col items-center">
          <img src="/logo/atiyya-logo-icon.png" alt="Atiyya Logo" className="h-14 w-auto object-contain mb-1" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-50">
            <span className="font-cooper font-normal">Atiyya</span> Alparamba Unit
          </h1>
          <p className="text-sm text-muted-foreground">Guest Checkout / One-time Payment</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Confirm the member and subscriptions information before continuing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${activeTab === "subscriptions" ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"}`}
              >
                Monthly Support
              </button>
              {isSpecialEventActive && (
                <button
                  type="button"
                  onClick={() => setActiveTab("event")}
                  className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${activeTab === "event" ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"}`}
                >
                  Special Event
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === "subscriptions" ? (
                <div className="rounded-xl border bg-accent/30 p-4 space-y-4 dark:bg-slate-800/50 dark:border-slate-700">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">subscriptions Period</Label>
                    <div className="rounded-lg border border-primary/30 bg-white p-3 text-sm font-medium text-slate-900 dark:border-blue-500/50 dark:bg-slate-800 dark:text-slate-50">
                      {currentContributionPeriod} subscriptions
                      <p className="mt-1 text-xs font-normal text-muted-foreground">The final amount is resolved from the member record on the server.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Membership Tier</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setDuesTier(paymentSettings.baseTier)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${duesTier === paymentSettings.baseTier ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-lg leading-none">₹{paymentSettings.baseTier}</span>
                        <span className="text-[10px] uppercase tracking-wider">Base / Month</span>
                      </button>
                      <button type="button" onClick={() => setDuesTier(paymentSettings.premiumTier)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${duesTier === paymentSettings.premiumTier ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-lg leading-none">₹{paymentSettings.premiumTier}</span>
                        <span className="text-[10px] uppercase tracking-wider">Premium / Month</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex justify-between items-baseline mt-2 dark:border-slate-700">
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
                    {activeTab === "event" && finalAmount > 0 && finalAmount < paymentSettings.customMinimum && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3" /> Minimum amount is ₹{paymentSettings.customMinimum}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Payment Summary</p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Member</dt><dd className="max-w-[62%] truncate text-right font-semibold text-slate-900 dark:text-slate-50">{memberQuery.trim() || "Enter member details"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">subscriptions Period</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-50">{activeTab === "subscriptions" ? currentContributionPeriod : "Approved event"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Payment Purpose</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-50">Educational Subscription</dd></div>
                <div className="flex items-center justify-between gap-4 border-t border-blue-100 pt-2 dark:border-blue-500/20"><dt className="font-semibold text-slate-700 dark:text-slate-300">Amount</dt><dd className="text-right text-lg font-bold text-slate-950 dark:text-slate-50">₹{finalAmount || 0}</dd></div>
              </dl>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/5 text-primary dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50" : "text-muted-foreground hover:text-foreground dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"} ${!isUpiAvailable ? "cursor-not-allowed opacity-60" : ""}`}
                  onClick={() => setPaymentMethod("upi")}
                  disabled={!isUpiAvailable}
                >
                  <CreditCard className="size-5" />
                  <span className="text-xs">{isUpiAvailable ? "UPI App" : "UPI Under Review"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5 text-primary dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50" : "text-muted-foreground hover:text-foreground dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"}`}
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

              {/* UPI Options Dropdown/Area */}
              {paymentMethod === "upi" && isUpiAvailable && (
                <div className="mt-4 p-4 rounded-xl border bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 dark:bg-slate-800/50 dark:border-slate-700">
                  <p className="text-xs font-medium text-muted-foreground">Select your UPI App</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "gpay" ? "border-primary bg-primary/5 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50" : "bg-background dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"}`}
                      onClick={() => setSelectedUpiApp("gpay")}
                    >
                      <img src="/icons/googlepay.svg" alt="GPay" className="h-6 w-auto object-contain" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "phonepe" ? "border-primary bg-primary/5 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50" : "bg-background dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"}`}
                      onClick={() => setSelectedUpiApp("phonepe")}
                    >
                      <img src="/icons/phonepe.svg" alt="PhonePe" className="h-6 w-auto object-contain" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "paytm" ? "border-primary bg-primary/5 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50" : "bg-background dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"}`}
                      onClick={() => setSelectedUpiApp("paytm")}
                    >
                      <img src="/icons/paytm.svg" alt="Paytm" className="h-5 w-auto object-contain" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`justify-center gap-2 h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "other" ? "border-primary bg-primary/5 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50" : "bg-background dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"}`}
                      onClick={() => setSelectedUpiApp("other")}
                    >
                      <QrCode className="h-5 w-5 text-primary" />
                      <span className="font-medium">Other</span>
                    </Button>
                  </div>

                  {selectedUpiApp === "other" && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Cashfree will securely show the available payment options after you continue.</p>
                      </div>

                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Or</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border-[#E5EAF3] hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                        disabled={isButtonDisabled || isProcessing}
                        onClick={handleQrClick}
                      >
                        <QrCode className="h-5 w-5 text-primary" />
                        <span>Open Digital Payment</span>
                      </Button>

                      {isQrInlineOpen && (
                        <div className="pt-2 pb-1 border-t border-slate-100 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Scan & Pay ₹{finalAmount || 0}</p>
                          <div className="border border-slate-200 p-2 rounded-xl bg-white shadow-sm">
                            {renderMockQrCode()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cash Handover Options (Admin Dropdown) */}
              {paymentMethod === "cash" && (
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
            {cashfreeError && (
              <div className="flex flex-col gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20 w-full animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-2.5 w-full">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed break-words flex-1">{cashfreeError}</span>
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
            
            {checkoutHint && !cashfreeError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {checkoutHint}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            {paymentMethod === "upi" ? (
              <Button
                size="lg"
                className="w-full text-lg h-14 rounded-xl"
                disabled={isButtonDisabled || isProcessing}
                onClick={handleRazorpayCheckout}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Make Payment ₹${finalAmount || 0} via UPI`
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full text-lg h-14 rounded-xl"
                disabled={isButtonDisabled}
                onClick={handleCashHandover}
              >
                Record ₹{finalAmount || 0} Cash Payment
              </Button>
            )}
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 font-medium">
              <ShieldCheck className="size-4 text-green-600" /> Secure SSL Encrypted Transaction
            </p>
          </CardFooter>
        </Card>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-200"
            onClick={() => setShowQrModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5EAF3] max-w-sm w-full z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border-slate-700">
            {/* Modal Header */}
            <div className="bg-[#F6F8FC] border-b border-[#E5EAF3] p-4 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <img src="/logo/atiyya-logo-icon.png" alt="Atiyya Logo" className="h-7 w-auto object-contain" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <span className="font-cooper font-normal">Atiyya</span> Alparamba Unit
                </span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                onClick={() => setShowQrModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center">
              <span className="bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-green-100 mb-4">
                Official UPI Terminal
              </span>

              <div className="border border-[#E5EAF3] p-4 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-5 dark:border-slate-700 dark:bg-slate-800">
                {renderMockQrCode()}
              </div>

              {/* Transaction Detail Card */}
              <div className="w-full bg-[#F6F8FC] border border-[#E5EAF3] rounded-xl p-3.5 space-y-2 mb-6 text-left dark:bg-slate-800 dark:border-slate-700">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Payment Purpose</span>
                  <span className="text-slate-700 font-semibold">Educational Subscription</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Merchant Account</span>
                  <span className="text-slate-700 font-semibold">Atiyya Group</span>
                </div>
                <div className="border-t border-[#E5EAF3] pt-2.5 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold">Amount to Pay</span>
                  <span className="text-xl font-bold text-slate-900">₹{finalAmount || 0}.00</span>
                </div>
              </div>

              {/* Secure Footer */}
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-4">
                <ShieldCheck className="size-4 text-green-600" /> Powered by BHIM UPI / Secure Transaction
              </p>

              <Button
                type="button"
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all"
                onClick={() => setShowQrModal(false)}
              >
                Close Terminal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import Script from "next/script";

export default function PayNowPage() {
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Suspense fallback={<div className="min-h-screen bg-secondary/50 flex items-center justify-center p-4"><p className="text-muted-foreground font-medium animate-pulse">Loading payment details...</p></div>}>
      <PayNowContent />
    </Suspense>
    </>
  )
}

