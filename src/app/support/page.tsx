import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MessageSquare, ArrowLeft, Mail, Clock } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to Home
        </Link>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Support & Contact</h1>
          <p className="text-sm text-muted-foreground">We're here to help with your portal queries.</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>Reach out to the Committee</CardTitle>
            <CardDescription>Select a method below to contact the support team directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <MessageSquare className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">WhatsApp Support</h3>
                  <p className="text-xs text-muted-foreground">Fastest response time (24/7)</p>
                </div>
              </div>
            </a>

            <a href="tel:+919876543210" className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Phone className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Call Treasurer</h3>
                  <p className="text-xs text-muted-foreground">+91 98765 43210</p>
                </div>
              </div>
            </a>

            <a href="mailto:support@ssfalparamba.com" className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Email Support</h3>
                  <p className="text-xs text-muted-foreground">For formal inquiries</p>
                </div>
              </div>
            </a>

            <div className="pt-4 border-t flex items-center justify-center text-xs text-muted-foreground gap-1.5">
              <Clock className="size-4" /> Standard response time: 2-4 hours
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
