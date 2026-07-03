import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Users, ArrowRight, HeartHandshake } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            {/* Logo placeholder */}
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <HeartHandshake className="size-5" />
            </div>
            <span className="hidden sm:inline-block"><span className="font-cooper font-normal tracking-wide">SSF</span> Alparamba</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button size="sm" className="rounded-full px-4">Member Login</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-20 md:pb-32 border-b">
          {/* Subtle Geometric Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', 
                 backgroundSize: '32px 32px' 
               }}>
          </div>
          
          <div className="container relative z-10 flex flex-col items-center text-center space-y-10">
            <div className="space-y-5 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                <span className="font-cooper font-normal tracking-wide">SSF</span> Alparamba <br /> Varisankhya Portal
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                A trust-first digital collection portal. Fostering transparency and accountability in our community contributions.
              </p>
            </div>
            
            <Card className="w-full max-w-sm sm:max-w-md border-primary/20 shadow-lg shadow-primary/5">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Month</p>
                  <div className="text-5xl font-bold tabular-nums tracking-tight">₹50</div>
                </div>
                <Link href="/pay" className="w-full">
                  <Button size="lg" className="w-full text-lg h-14 rounded-xl shadow-md">
                    Pay Now <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="size-4 text-green-600" /> Secure UPI & Cash Acknowledgement
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social Proof Strip */}
        <section className="bg-primary text-primary-foreground">
          <div className="container py-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-sm sm:text-base font-medium">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              <span className="tabular-nums">₹12,450 collected this month</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-primary-foreground/20" />
            <div className="flex items-center gap-2">
              <Users className="size-4 opacity-80" />
              <span className="tabular-nums">82% of members paid</span>
            </div>
          </div>
        </section>

        {/* How it Works & Benefits */}
        <section className="py-20 md:py-28 container space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Simple, transparent, and completely digital. Pay your monthly contribution in seconds.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-xl">Enter Details</h3>
              <p className="text-muted-foreground">Enter your phone number or member ID to securely view your pending dues.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-xl">Make Payment</h3>
              <p className="text-muted-foreground">Pay instantly via UPI apps like GPay, PhonePe, or log a physical cash payment.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm border border-green-100">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-xl">Instant Receipt</h3>
              <p className="text-muted-foreground">Get a verified digital receipt instantly on your WhatsApp for your records.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">
              <HeartHandshake className="size-3" />
            </div>
            <span className="text-sm"><span className="font-cooper font-normal tracking-wide">SSF</span> Alparamba Unit</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Committed to complete financial transparency. 
            <a href="#" className="text-primary hover:underline ml-1 font-medium">View public collection summary</a>.
          </p>
        </div>
      </footer>
    </div>
  )
}
