"use client";

import React, { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CheckCircle2, Download, Share2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const method = searchParams.get("method") || "upi"
  const admin = searchParams.get("admin") || ""
  const phone = searchParams.get("phone") || "Guest User"
  const amount = searchParams.get("amount") || "100"
  const category = searchParams.get("category") || "dues"

  return (
    <div className="min-h-screen bg-green-50/30 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2 flex flex-col items-center">
          <img src="/logo/logo.webp" alt="SSF Logo" className="h-12 w-auto object-contain mb-2" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <span className="font-cooper font-normal">SSF</span> Alparamba Unit
          </h1>
        </div>

        <Card className="shadow-lg border-green-100 overflow-hidden relative">
          {/* Top green accent bar */}
          <div className="h-2 w-full bg-green-500 absolute top-0 left-0" />
          
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6 pt-10">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center relative">
                <CheckCircle2 className="size-10 text-green-600" />
                {/* Subtle success pulse effect */}
                <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-ping" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-green-700">Payment Successful</h2>
              <p className="text-sm text-muted-foreground">Thank you for your contribution</p>
            </div>

            <div className="w-full rounded-xl bg-secondary/50 p-5 space-y-3">
              <div className="text-center pb-3 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount Paid</span>
                <div className="text-3xl font-bold tabular-nums">₹{amount}</div>
              </div>
              
              <div className="space-y-2 text-sm pt-2 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-medium">TXN-8924719</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">02 Jul 2026, 18:35</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid By</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{method === "cash" ? "Cash Handover" : "UPI App"}</span>
                </div>
                {method === "cash" && admin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received By</span>
                    <span className="font-medium">{admin}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 px-8 pb-8">
            <div className="flex gap-3 w-full">
              <Link href={`/receipt/TXN-8924719?method=${method}&admin=${encodeURIComponent(admin)}&phone=${encodeURIComponent(phone)}&amount=${amount}&category=${category}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 size-4" /> Receipt
                </Button>
              </Link>
              <Button variant="outline" className="flex-1">
                <Share2 className="mr-2 size-4" /> Share
              </Button>
            </div>
            <Link href="/" className="w-full">
              <Button className="w-full h-12 rounded-xl text-md">
                Done <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50/30 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading payment status...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
