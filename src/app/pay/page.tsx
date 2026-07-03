import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CreditCard, Banknote, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function PayNowPage() {
  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to Home
        </Link>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground"><span className="font-cooper font-normal">SSF</span> Alparamba</h1>
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
                <span className="font-medium">₹150</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Arrears (1 Month)</span>
                <span className="font-medium text-destructive">₹150</span>
              </div>
              <div className="pt-3 border-t border-border/50 flex justify-between font-bold text-lg">
                <span>Total Due</span>
                <span>₹300</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex flex-col gap-1 border-primary/50 bg-primary/5">
                  <CreditCard className="size-5 text-primary" />
                  <span className="text-xs">UPI App</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1 text-muted-foreground">
                  <Banknote className="size-5" />
                  <span className="text-xs">Cash Handover</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Link href="/success" className="w-full">
              <Button size="lg" className="w-full text-lg h-14 rounded-xl">
                Pay ₹300 Now
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
