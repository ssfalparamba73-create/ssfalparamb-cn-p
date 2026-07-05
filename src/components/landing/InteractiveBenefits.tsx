"use client"

import { useState } from "react"
import { Droplet, Users, SmartphoneNfc, ArrowRight, ShieldCheck, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  {
    id: "payments",
    title: "Seamless Contributions",
    shortTitle: "Payments",
    icon: CreditCard,
    color: "violet",
    bgClass: "bg-violet-50",
    textClass: "text-violet-600",
    borderClass: "border-violet-100",
    activeBg: "bg-violet-600",
    shadowClass: "shadow-[0_20px_60px_rgba(124,58,237,0.15)]",
    description: "Pay your monthly dues or special event funds easily online. Keep track of arrears, view digital receipts, and manage all your contributions in one place.",
    highlight: "Fast & Secure"
  },
  {
    id: "blood",
    title: "Emergency Blood Support",
    shortTitle: "Blood Support",
    icon: Droplet,
    color: "rose",
    bgClass: "bg-rose-50",
    textClass: "text-rose-600",
    borderClass: "border-rose-100",
    activeBg: "bg-rose-500",
    shadowClass: "shadow-[0_20px_60px_rgba(225,29,72,0.15)]",
    description: "Quick access to our active blood donors directory. Find or become a donor in times of need instantly through our streamlined, life-saving interface.",
    highlight: "500+ Active Donors"
  },
  {
    id: "community",
    title: "Community Connection",
    shortTitle: "Community",
    icon: Users,
    color: "emerald",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-600",
    borderClass: "border-emerald-100",
    activeBg: "bg-emerald-500",
    shadowClass: "shadow-[0_20px_60px_rgba(16,185,129,0.15)]",
    description: "Stay updated with committee announcements, events, and easily reach out to admins. Your digital hub for all Alparamba unit members.",
    highlight: "Always Connected"
  },
  {
    id: "membership",
    title: "Secure Membership",
    shortTitle: "Membership",
    icon: SmartphoneNfc,
    color: "blue",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
    borderClass: "border-blue-100",
    activeBg: "bg-blue-600",
    shadowClass: "shadow-[0_20px_60px_rgba(37,99,235,0.15)]",
    description: "Access your Digital ID card and view your seamless contribution history anytime, securely. Complete transparency right at your fingertips.",
    highlight: "100% Transparent"
  },
]

export function InteractiveBenefits() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 flex flex-col items-center">
      
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 p-1.5 bg-white/70 backdrop-blur-xl border border-white/80 rounded-[1.5rem] shadow-[0_8px_30px_rgba(15,23,42,0.06)] w-full max-w-full">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === idx
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "relative flex items-center gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-[13px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap flex-1 sm:flex-none justify-center border",
                isActive 
                  ? cn("bg-white shadow-sm", tab.textClass, tab.borderClass)
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
              )}
            >
              <Icon className={cn("size-3.5 md:size-4 shrink-0", isActive ? tab.textClass : "text-slate-400")} />
              {tab.shortTitle}
            </button>
          )
        })}
      </div>

      {/* Content Display */}
      <div className="mt-8 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent blur-3xl -z-10 rounded-[3rem]" />
        
        {tabs.map((tab, idx) => {
          const isActive = activeTab === idx
          const Icon = tab.icon

          if (!isActive) return null

          return (
            <div 
              key={tab.id}
              className={cn(
                "animate-in fade-in zoom-in-95 duration-500",
                "overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/70 bg-white/60 backdrop-blur-2xl p-6 md:p-8 lg:p-12",
                tab.shadowClass
              )}
            >
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                
                {/* Text Content */}
                <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                  
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.03em] leading-tight">
                    {tab.title}
                  </h3>
                  
                  <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
                    {tab.description}
                  </p>

                  <button 
                    onClick={() => {
                      document.getElementById('login-card')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="group flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-slate-950 hover:text-blue-600 transition-colors mx-auto md:mx-0 pt-2 w-full md:w-auto"
                  >
                    Explore Feature 
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* Visual / Graphic Side */}
                <div className="w-48 h-48 md:h-auto md:w-[400px] aspect-square rounded-full md:rounded-[2rem] border border-slate-100 bg-white shadow-sm flex shrink-0 items-center justify-center relative overflow-hidden group transition-all duration-500 hover:shadow-md hover:border-slate-200">
                  <div className={cn("absolute inset-0 opacity-10 transition-transform duration-700 group-hover:scale-125", tab.bgClass)} />
                  <div className={cn(
                    "relative flex items-center justify-center w-20 h-20 md:w-32 md:h-32 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white border border-slate-50 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)]",
                    tab.textClass
                  )}>
                    <Icon className="size-8 md:size-14 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" strokeWidth={1.5} />
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
