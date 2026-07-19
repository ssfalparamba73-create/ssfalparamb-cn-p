"use client";

import { useState, Suspense, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Smartphone, QrCode, ChevronDown, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function PayNowContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrInlineOpen, setIsQrInlineOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");

  // Preload receipt images in the background without causing lag
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadImages = () => {
      const images = ["/recept.svg", "/logo/logo-transparent.svg"];
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

  // New states for Dues & Events
  const [activeTab, setActiveTab] = useState<"dues" | "event">("dues");
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["current"]);
  const [duesTier, setDuesTier] = useState<50 | 100>(50);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Admin toggle for Special Event
  const isSpecialEventActive = true;

  const mockPendingMonths = [
    { id: "current", label: "July 2026 (Current Month)" },
    { id: "arrear_1", label: "June 2026 (Arrears)" },
    { id: "arrear_2", label: "May 2026 (Arrears)" },
  ];

  const handleMonthToggle = (id: string) => {
    setSelectedMonths(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  let finalAmount = 0;
  if (activeTab === "dues") {
    finalAmount = selectedMonths.length * duesTier;
  } else {
    finalAmount = parseInt(customAmount) || 0;
  }

  const isButtonDisabled =
    !memberQuery.trim() ||
    (paymentMethod === "cash" && !selectedAdmin) ||
    (activeTab === "dues" && selectedMonths.length === 0) ||
    (activeTab === "event" && finalAmount < 30);

  const admins = [
    { id: "1", name: "Farhan", role: "President" },
    { id: "2", name: "Shafi", role: "Secretary" },
    { id: "3", name: "Faisal", role: "Treasurer" },
    { id: "4", name: "Yasir", role: "Joint Secretary" },
    { id: "5", name: "Najeeb", role: "Vice President" },
    { id: "6", name: "Anas", role: "Committee Member" },
  ];

  const handleQrClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setShowQrModal(true);
    } else {
      setIsQrInlineOpen(!isQrInlineOpen);
    }
  };

  // Removed old isButtonDisabled

  const renderMockQrCode = () => (
    <svg width="180" height="180" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40 mx-auto text-slate-800">
      <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2zM0 22h7v7H0v-7zm1 1v5h5v-5H1zm2 2v-1h1v1H3zm-2-2h1v1H1v-1zm4 0h1v1H5v-1zm1 2h1v1H6v-1zm-4 2h1v1H2v-1zm3 0h1v1H5v-1zM22 0h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2zM22 22h7v7h-7v-7zm1 1h5v5h-5v-5zm2 2h1v1h-1v-1zM9 1h1v1H9V1zm2 0h1v1h-1V1zm3 0h2v1h-2V1zm4 0h1v1h-1V1zm-9 2h1v1H9V3zm2 0h2v1h-2V3zm3 0h1v1h-1V3zm2 0h1v1h-1V3zm-8 2h2v1H9V5zm3 0h1v1h-1V5zm1 0h1v1h-1V5zm2 0h1v1h-1V5zm-7 2h1v1H9V7zm2 0h1v1h-1V7zm2 0h2v1h-2V7zm3 0h1v1h-1V7zm-8 2h1v1H8V9zm3 0h2v1h-2V9zm4 0h1v1h-1V9zm-8 2h1v1H8v-1zm2 0h1v1h-1v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-9 2h2v1H8v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-9 2h1v1H8v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm4 0h1v1h-1v-1zm-9 2h1v1H8v-1zm3 0h2v1h-2v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm-8 2h1v1H9v-1zm2 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-7 2h2v1H9v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-7 2h1v1H9v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12 relative transition-colors duration-300 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6">
        <Link href={source === "member" ? "/member/dashboard" : "/"} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> {source === "member" ? "Back to Dashboard" : "Back to Home"}
        </Link>

        <div className="text-center space-y-2 flex flex-col items-center">
          <img src="/logo/logo-transparent.svg" alt="SSF Logo" className="h-14 w-auto object-contain mb-1" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-50">
            <span className="font-cooper font-normal">SSF</span> Alparamba Unit
          </h1>
          <p className="text-sm text-muted-foreground">Guest Checkout / One-time Payment</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>Member Details</CardTitle>
            <CardDescription>Enter your details to fetch pending dues.</CardDescription>
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
            </div>

            {/* Category Tabs */}
            <div className="bg-secondary/50 p-1 rounded-xl flex items-center mb-2 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("dues")}
                className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${activeTab === "dues" ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-blue-400" : "text-muted-foreground hover:text-foreground dark:hover:text-slate-200"}`}
              >
                Monthly Dues
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
              {activeTab === "dues" ? (
                <div className="rounded-xl border bg-accent/30 p-4 space-y-4 dark:bg-slate-800/50 dark:border-slate-700">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Pending Months</Label>
                    <div className="space-y-2">
                      {mockPendingMonths.map((month) => (
                        <label key={month.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedMonths.includes(month.id) ? "bg-white border-primary shadow-sm dark:bg-blue-500/10 dark:border-blue-500/50" : "bg-white/50 border-border/50 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"}`}>
                          <div className={`size-5 rounded-md border flex items-center justify-center transition-colors ${selectedMonths.includes(month.id) ? "bg-primary border-primary text-white dark:bg-blue-600 dark:border-blue-600" : "border-slate-300 bg-white dark:bg-slate-700 dark:border-slate-600"}`}>
                            {selectedMonths.includes(month.id) && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <span className={`text-sm font-medium ${selectedMonths.includes(month.id) ? "text-slate-900 dark:text-slate-50" : "text-slate-600 dark:text-slate-300"}`}>{month.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Contribution Tier</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setDuesTier(50)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${duesTier === 50 ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-lg leading-none">₹50</span>
                        <span className="text-[10px] uppercase tracking-wider">Base / Month</span>
                      </button>
                      <button type="button" onClick={() => setDuesTier(100)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${duesTier === 100 ? "bg-primary/5 border-primary text-primary dark:bg-blue-500/10 dark:border-blue-500/50 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 hover:border-primary/40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40"}`}>
                        <span className="font-bold text-lg leading-none">₹100</span>
                        <span className="text-[10px] uppercase tracking-wider">Premium / Month</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex justify-between items-baseline mt-2 dark:border-slate-700">
                    <span className="text-slate-500 font-medium">Total Dues</span>
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
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Ramadan Relief Fund</h4>
                      <p className="text-xs text-amber-700/80 mt-0.5 leading-snug dark:text-amber-200/70">Your generous contributions help those in need during this special month.</p>
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
                        min="30"
                      />
                    </div>
                    {activeTab === "event" && finalAmount > 0 && finalAmount < 30 && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="size-3" /> Minimum amount is ₹30
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-16 flex flex-col gap-1 transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/5 text-primary dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50" : "text-muted-foreground hover:text-foreground dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"}`}
                  onClick={() => setPaymentMethod("upi")}
                >
                  <CreditCard className="size-5" />
                  <span className="text-xs">UPI App</span>
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

              {/* UPI Options Dropdown/Area */}
              {paymentMethod === "upi" && (
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
                        <Label htmlFor="upi-id" className="text-xs text-muted-foreground">Enter UPI ID</Label>
                        <Input id="upi-id" placeholder="example@okhdfcbank" className="mt-1 h-11 bg-background dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-50 dark:focus-visible:ring-blue-500/30 dark:focus-visible:border-blue-500/50" />
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
                        onClick={handleQrClick}
                      >
                        <QrCode className="h-5 w-5 text-primary" />
                        <span>Show QR Code</span>
                      </Button>

                      {isQrInlineOpen && (
                        <div className="pt-2 pb-1 border-t border-slate-100 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Scan & Pay ₹100</p>
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
                          ? `${selectedAdmin} (${admins.find(a => a.name === selectedAdmin)?.role})`
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
                                selectedAdmin === admin.name
                                  ? "bg-primary/10 text-primary font-medium dark:bg-blue-500/15 dark:text-blue-400"
                                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                              }`}
                              onClick={() => {
                                setSelectedAdmin(admin.name);
                                setIsAdminDropdownOpen(false);
                              }}
                            >
                              <span className="font-semibold text-[14px] leading-tight">{admin.name}</span>
                              <span className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">{admin.role}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Link
              href={isButtonDisabled ? "#" : `/success?method=${paymentMethod}&admin=${encodeURIComponent(selectedAdmin)}&phone=${encodeURIComponent(memberQuery)}&amount=${finalAmount}${activeTab === 'event' ? '&category=special_event' : ''}${source === 'member' ? '&source=member' : ''}`}
              className={`w-full ${isButtonDisabled ? "pointer-events-none" : ""}`}
            >
              <Button
                size="lg"
                className="w-full text-lg h-14 rounded-xl"
                disabled={isButtonDisabled}
              >
                {paymentMethod === "upi" ? `Pay ₹${finalAmount || 0} via UPI` : `Record ₹${finalAmount || 0} Cash`}
              </Button>
            </Link>
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
                <img src="/logo/logo-transparent.svg" alt="SSF Logo" className="h-7 w-auto object-contain" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  <span className="font-cooper font-normal">SSF</span> Alparamba Unit
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
                  <span className="text-slate-700 font-semibold">Monthly Dues Collection</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Merchant Account</span>
                  <span className="text-slate-700 font-semibold">SSF Alparamba Unit</span>
                </div>
                <div className="border-t border-[#E5EAF3] pt-2.5 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold">Amount to Pay</span>
                  <span className="text-xl font-bold text-slate-900">₹100.00</span>
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

export default function PayNowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-secondary/50 flex items-center justify-center p-4"><p className="text-muted-foreground font-medium animate-pulse">Loading payment details...</p></div>}>
      <PayNowContent />
    </Suspense>
  )
}
