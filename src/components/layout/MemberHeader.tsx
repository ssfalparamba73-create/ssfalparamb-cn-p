"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MemberHeader() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/member/dashboard" },
    { name: "Community", href: "/member/directory" },
    { name: "Payments", href: "/member/payments" },
    { name: "Profile", href: "/member/profile" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F8FC] border-b border-[#E5EAF3]">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full relative">
        
        {/* MOBILE VIEW: Left Side - Avatar & Name (Hidden on Desktop) */}
        <div className="flex md:hidden items-center gap-3">
          <div className="relative size-10 flex items-center justify-center rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-sm">
            <span className="text-[13px] font-bold text-blue-700">SA</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium leading-none mb-1">Welcome back,</span>
            <span className="text-sm font-bold text-slate-900 leading-none">Safvan Alparamba</span>
          </div>
        </div>

        {/* DESKTOP VIEW: Left Side - Brand Logo (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <img src="/logo/logo.webp" alt="SSF Logo" className="h-10 w-auto object-contain" style={{ mixBlendMode: "multiply", filter: "contrast(1.05)" }} />
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            <span className="font-cooper font-normal text-[22px] mr-1">SSF</span> Alparamba Unit
          </span>
        </div>

        {/* DESKTOP VIEW: Center - Navigation (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive 
                    ? "bg-white text-[#2563EB] shadow-sm border border-[#E5EAF3]" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Actions (Desktop Avatar + Universal Bell) */}
        <div className="flex items-center gap-4">
          
          {/* DESKTOP VIEW: Right Side - Avatar & Name (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3 text-right">
             <div className="flex flex-col">
               <span className="text-sm font-bold text-slate-900 leading-none mb-1">Safvan Alparamba</span>
               <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none">Member</span>
             </div>
             <div className="relative size-10 flex items-center justify-center rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-sm">
               <span className="text-[13px] font-bold text-blue-700">SA</span>
             </div>
          </div>

          {/* Universal Notification Bell */}
          <button 
            type="button" 
            className="relative size-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-slate-600 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 shrink-0"
          >
            <Bell className="size-5" />
            <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
