"use client";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck, Smartphone, QrCode } from "lucide-react"
import Link from "next/link"

export default function PayNowPage() {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");

  const admins = [
    { id: "1", name: "Farhan", role: "President" },
    { id: "2", name: "Shafi", role: "Secretary" },
    { id: "3", name: "Faisal", role: "Treasurer" },
    { id: "4", name: "Yasir", role: "Joint Secretary" },
    { id: "5", name: "Najeeb", role: "Vice President" },
    { id: "6", name: "Anas", role: "Committee Member" },
  ];

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12">
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
              <Input id="phone" placeholder="Enter your 10 digit number" type="tel" />
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
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Label htmlFor="upi-id" className="text-xs text-muted-foreground">Enter UPI ID</Label>
                      <Input id="upi-id" placeholder="example@okhdfcbank" className="mt-1 h-11 bg-background" />
                    </div>
                  )}
                </div>
              )}

              {/* Cash Handover Options (Admin Dropdown) */}
              {paymentMethod === "cash" && (
                <div className="mt-4 p-4 rounded-xl border bg-secondary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="admin-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Received By / പണം സ്വീകരിച്ച ആൾ
                  </Label>
                  <select
                    id="admin-select"
                    className="flex h-12 w-full rounded-xl border border-[#E5EAF3] bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary transition-all text-foreground"
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Admin / അഡ്മിനെ തിരഞ്ഞെടുക്കുക</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.name}>
                        {admin.name} ({admin.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Link 
              href={paymentMethod === "cash" && !selectedAdmin ? "#" : "/success"} 
              className={`w-full ${paymentMethod === "cash" && !selectedAdmin ? "pointer-events-none" : ""}`}
            >
              <Button 
                size="lg" 
                className="w-full text-lg h-14 rounded-xl"
                disabled={paymentMethod === "cash" && !selectedAdmin}
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
    </div>
  )
}
