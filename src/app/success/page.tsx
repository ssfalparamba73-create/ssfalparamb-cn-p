import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CheckCircle2, Download, Share2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-green-50/30 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground"><span className="font-cooper font-normal">SSF</span> Alparamba</h1>
        </div>

        <Card className="shadow-lg border-green-100 overflow-hidden relative">
          {/* Top green accent bar */}
          <div className="h-2 w-full bg-green-500 absolute top-0 left-0" />
          
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6 pt-10">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center relative">
              <CheckCircle2 className="size-10 text-green-600" />
              {/* Subtle success pulse effect */}
              <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-ping" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-green-700">Payment Successful</h2>
              <p className="text-sm text-muted-foreground">Thank you for your contribution</p>
            </div>

            <div className="w-full rounded-xl bg-secondary/50 p-5 space-y-3">
              <div className="text-center pb-3 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount Paid</span>
                <div className="text-3xl font-bold tabular-nums">₹300</div>
              </div>
              
              <div className="space-y-2 text-sm pt-2">
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
                  <span className="font-medium">Guest User</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 px-8 pb-8">
            <div className="flex gap-3 w-full">
              <Link href="/receipt/TXN-8924719" className="flex-1">
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
