"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MessageSquare, ArrowLeft, Mail, Clock } from "lucide-react"
import Link from "next/link"
import type { SupportContactDTO } from "@/lib/backend/dto/support.dto"
import { getSupportContacts } from "@/lib/api/supportClient"

export default function SupportPage() {
  const [contacts, setContacts] = useState<SupportContactDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getSupportContacts()
      .then((result) => {
        if (!active) return
        setContacts(result)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : "Unable to load support contacts.")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const primaryContact = contacts[0]
  const emailContact = contacts.find((contact) => contact.email)
  const whatsappNumber = primaryContact?.phone.replace(/\D/g, "")

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to Home
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Support & Contact</h1>
          <p className="text-sm text-muted-foreground">We&apos;re here to help with your portal queries.</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>Reach out to the Committee</CardTitle>
            <CardDescription>Select a method below to contact the support team directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading support contacts...</p>}
            {loadError && <p className="py-6 text-center text-sm text-destructive">{loadError}</p>}
            {!isLoading && !loadError && !primaryContact && (
              <p className="py-6 text-center text-sm text-muted-foreground">No active support contact is available right now.</p>
            )}

            {primaryContact && whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <MessageSquare className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">WhatsApp Support</h3>
                  <p className="text-xs text-muted-foreground">Fastest response time (24/7)</p>
                </div>
              </div>
            </a>}

            {primaryContact && <a href={`tel:${primaryContact.phone}`} className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Phone className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Call {primaryContact.role ?? primaryContact.name}</h3>
                  <p className="text-xs text-muted-foreground">{primaryContact.phone}</p>
                </div>
              </div>
            </a>}

            {emailContact?.email && <a href={`mailto:${emailContact.email}`} className="block">
              <div className="flex items-center p-4 border rounded-xl hover:bg-accent transition-colors gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Email Support</h3>
                  <p className="text-xs text-muted-foreground">For formal inquiries</p>
                </div>
              </div>
            </a>}

            <div className="pt-4 border-t flex items-center justify-center text-xs text-muted-foreground gap-1.5">
              <Clock className="size-4" /> Standard response time: 2-4 hours
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
