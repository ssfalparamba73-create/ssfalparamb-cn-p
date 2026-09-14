"use client";

import React, { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/backend/composition/contactService.server";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await submitContactMessage(data);
      if (res.success) {
        setIsSuccess(true);
        toast.success("Your message has been sent successfully!");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred while sending the message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
        <p className="text-slate-600 text-sm mb-6">
          Thank you for reaching out. Our team will review your message and get back to you shortly.
        </p>
        <Button variant="outline" onClick={() => setIsSuccess(false)} className="rounded-xl">
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
          <Input id="name" name="name" required placeholder="Your name" className="rounded-xl h-11 bg-white/70" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
          <Input id="email" type="email" name="email" required placeholder="you@example.com" className="rounded-xl h-11 bg-white/70" />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Mobile Number (Optional)</label>
        <Input id="phone" name="phone" type="tel" placeholder="+91 0000000000" className="rounded-xl h-11 bg-white/70" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-semibold text-slate-700">Your Message</label>
        <Textarea 
          id="message" 
          name="message" 
          required 
          placeholder="How can we help you with our educational programs?" 
          className="rounded-xl min-h-[120px] bg-white/70 resize-y" 
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full sm:w-auto rounded-xl h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20"
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
        ) : (
          <><Send className="mr-2 h-4 w-4" /> Send Message</>
        )}
      </Button>
    </form>
  );
}
