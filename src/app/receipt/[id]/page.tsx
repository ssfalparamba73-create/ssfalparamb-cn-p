"use client";

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, Share2, HeartHandshake, QrCode, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const searchParams = useSearchParams()
  
  const receiptId = resolvedParams.id || "TXN-8924719"
  const date = "02 Jul 2026, 18:35"
  
  const method = searchParams.get("method") || "upi"
  const admin = searchParams.get("admin") || ""
  const phone = searchParams.get("phone") || "Guest Member"
  const amount = searchParams.get("amount") || "100"
  
  return (
    <div className="min-h-screen bg-secondary/50 p-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-[210mm] space-y-6"> {/* A4/A5 width container for print context */}
        
        {/* Screen-only controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link href={`/success?method=${method}&admin=${encodeURIComponent(admin)}&phone=${encodeURIComponent(phone)}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground self-start sm:self-auto">
            <ArrowLeft className="mr-2 size-4" /> Back
          </Link>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Share2 className="mr-2 size-4" /> Share PDF
            </Button>
            <Button className="flex-1 sm:flex-none">
              <Printer className="mr-2 size-4" /> Print
            </Button>
          </div>
        </div>

        {/* The Receipt Document */}
        <Card className="bg-background border-none shadow-xl overflow-hidden relative print:shadow-none print:border-border">
          {/* Subtle gold accent border & Arabesque pattern */}
          <div className="absolute top-0 left-0 w-full h-2 bg-[#C8A96B]" />
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <CardContent className="p-8 sm:p-12 space-y-10 relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-8">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <HeartHandshake className="size-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                    <span className="font-cooper font-normal">SSF</span> Alparamba
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Official Payment Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-1">Receipt No.</p>
                <p className="font-mono font-bold text-lg">{receiptId}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Received With Thanks From</p>
                  <p className="font-bold text-xl">{phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Towards</p>
                  <p className="font-medium">Monthly Contribution (Varisankhya)</p>
                  <p className="text-sm text-muted-foreground">July 2026 + 1 Month Arrears</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-xl p-6 flex flex-col justify-center items-end text-right border border-border/50">
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-2">Amount Paid</p>
                <p className="text-5xl font-bold tabular-nums text-foreground mb-4">₹{amount}</p>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-sm rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 inline-block"></span>
                  Payment Successful
                </Badge>
              </div>
            </div>

            {/* Footer / Meta */}
            <div className="flex items-end justify-between border-t border-border/50 pt-8 mt-8">
              <div className="space-y-1 text-left">
                <p className="text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Payment Method:</span>{" "}
                  <span className="font-medium">{method === "cash" ? "Cash Handover" : "UPI App"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">{method === "cash" ? "Collected By:" : "Verified By:"}</span>{" "}
                  <span className="font-medium">{method === "cash" ? admin : "Digital Portal"}</span>
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-16 w-16 bg-white p-1 rounded-md border shadow-sm flex items-center justify-center">
                  <QrCode className="size-full text-foreground/80" />
                </div>
                <p className="text-[10px] text-muted-foreground max-w-[120px] leading-tight">
                  Scan to verify authenticity of this receipt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground print:hidden">
          This receipt is computer generated and does not require a physical signature.
        </p>
      </div>
    </div>
  )
}
