"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Smartphone, QrCode, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function PayNowPage() {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isQrInlineOpen, setIsQrInlineOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");

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

  const isButtonDisabled = !memberQuery.trim() || (paymentMethod === "cash" && !selectedAdmin);

  const MockQrCodeSvg = () => (
    <svg width="180" height="180" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40 mx-auto text-slate-800">
      <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2zM0 22h7v7H0v-7zm1 1v5h5v-5H1zm2 2v-1h1v1H3zm-2-2h1v1H1v-1zm4 0h1v1H5v-1zm1 2h1v1H6v-1zm-4 2h1v1H2v-1zm3 0h1v1H5v-1zM22 0h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2zM22 22h7v7h-7v-7zm1 1h5v5h-5v-5zm2 2h1v1h-1v-1zM9 1h1v1H9V1zm2 0h1v1h-1V1zm3 0h2v1h-2V1zm4 0h1v1h-1V1zm-9 2h1v1H9V3zm2 0h2v1h-2V3zm3 0h1v1h-1V3zm2 0h1v1h-1V3zm-8 2h2v1H9V5zm3 0h1v1h-1V5zm1 0h1v1h-1V5zm2 0h1v1h-1V5zm-7 2h1v1H9V7zm2 0h1v1h-1V7zm2 0h2v1h-2V7zm3 0h1v1h-1V7zm-8 2h1v1H8V9zm3 0h2v1h-2V9zm4 0h1v1h-1V9zm-8 2h1v1H8v-1zm2 0h1v1h-1v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-9 2h2v1H8v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-9 2h1v1H8v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm4 0h1v1h-1v-1zm-9 2h1v1H8v-1zm3 0h2v1h-2v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm-8 2h1v1H9v-1zm2 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-7 2h2v1H9v-1zm3 0h1v1h-1v-1zm1 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-7 2h1v1H9v-1zm2 0h1v1h-1v-1zm2 0h2v1h-2v-1zm3 0h1v1h-1v-1z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12 relative">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to Home
        </Link>
        
        <div className="text-center space-y-2 flex flex-col items-center">
          <img src="/logo/logo.webp" alt="SSF Logo" className="h-14 w-auto object-contain mb-1" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
              />
            </div>
            
            {/* Mock Itemized Dues */}
            <div className="rounded-lg border bg-accent/50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Month</span>
                <span className="font-medium">₹50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Arrears (1 Month)</span>
                <span className="font-medium text-destructive">₹50</span>
              </div>
              <div className="pt-3 border-t border-border/50 flex justify-between font-bold text-lg">
                <span>Total Due</span>
                <span>₹100</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className={`h-16 flex flex-col gap-1 transition-all ${paymentMethod === "upi" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setPaymentMethod("upi")}
                >
                  <CreditCard className="size-5" />
                  <span className="text-xs">UPI App</span>
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  className={`h-16 flex flex-col gap-1 transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="size-5" />
                  <span className="text-xs">Cash Handover</span>
                </Button>
              </div>

              {/* UPI Options Dropdown/Area */}
              {paymentMethod === "upi" && (
                <div className="mt-4 p-4 rounded-xl border bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-medium text-muted-foreground">Select your UPI App</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "gpay" ? "border-primary bg-primary/5 shadow-sm" : "bg-background"}`}
                      onClick={() => setSelectedUpiApp("gpay")}
                    >
                      <img src="/icons/googlepay.svg" alt="GPay" className="h-6 w-auto object-contain" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "phonepe" ? "border-primary bg-primary/5 shadow-sm" : "bg-background"}`}
                      onClick={() => setSelectedUpiApp("phonepe")}
                    >
                      <img src="/icons/phonepe.svg" alt="PhonePe" className="h-6 w-auto object-contain" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`justify-center h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "paytm" ? "border-primary bg-primary/5 shadow-sm" : "bg-background"}`}
                      onClick={() => setSelectedUpiApp("paytm")}
                    >
                      <img src="/icons/paytm.svg" alt="Paytm" className="h-5 w-auto object-contain" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`justify-center gap-2 h-12 hover:bg-accent/50 transition-colors ${selectedUpiApp === "other" ? "border-primary bg-primary/5 shadow-sm" : "bg-background"}`}
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
                        <Input id="upi-id" placeholder="example@okhdfcbank" className="mt-1 h-11 bg-background" />
                      </div>
                      
                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-semibold tracking-wider">Or</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border-[#E5EAF3] hover:bg-slate-50 transition-all"
                        onClick={handleQrClick}
                      >
                        <QrCode className="h-5 w-5 text-primary" />
                        <span>Show QR Code</span>
                      </Button>

                      {isQrInlineOpen && (
                        <div className="pt-2 pb-1 border-t border-slate-100 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Scan & Pay ₹100</p>
                          <div className="border border-slate-200 p-2 rounded-xl bg-white shadow-sm">
                            <MockQrCodeSvg />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cash Handover Options (Admin Dropdown) */}
              {paymentMethod === "cash" && (
                <div className="mt-4 p-4 rounded-xl border bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 relative">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Received By
                  </Label>
                  
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5EAF3] bg-background px-4 py-2 text-base text-left transition-all hover:bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-primary"
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
                        <div className="absolute left-0 right-0 mt-2 z-30 max-h-40 overflow-auto rounded-xl border border-[#E5EAF3] bg-white p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                          {admins.map((admin) => (
                            <button
                              key={admin.id}
                              type="button"
                              className={`w-full text-left px-4 py-1.5 rounded-lg transition-colors flex flex-col ${
                                selectedAdmin === admin.name 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-slate-700 hover:bg-slate-50"
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
              href={isButtonDisabled ? "#" : `/success?method=${paymentMethod}&admin=${encodeURIComponent(selectedAdmin)}&phone=${encodeURIComponent(memberQuery)}&amount=100`} 
              className={`w-full ${isButtonDisabled ? "pointer-events-none" : ""}`}
            >
              <Button 
                size="lg" 
                className="w-full text-lg h-14 rounded-xl"
                disabled={isButtonDisabled}
              >
                {paymentMethod === "upi" ? "Pay ₹100 via UPI" : "Record ₹100 Cash"}
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
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5EAF3] max-w-sm w-full z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#F6F8FC] border-b border-[#E5EAF3] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo/logo.webp" alt="SSF Logo" className="h-7 w-auto object-contain" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
                <span className="text-sm font-semibold text-slate-900">
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
              
              <div className="border border-[#E5EAF3] p-4 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-5">
                <MockQrCodeSvg />
              </div>

              {/* Transaction Detail Card */}
              <div className="w-full bg-[#F6F8FC] border border-[#E5EAF3] rounded-xl p-3.5 space-y-2 mb-6 text-left">
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
