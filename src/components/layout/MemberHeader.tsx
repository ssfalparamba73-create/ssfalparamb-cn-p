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
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl mx-auto">
        
        {/* Left Side: Avatar & Name */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="relative size-10 flex items-center justify-center rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-sm">
              <span className="text-[13px] font-bold text-blue-700">SA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium leading-none mb-1">Welcome back,</span>
              <span className="text-sm font-bold text-slate-900 leading-none">Safvan Alparamba</span>
            </div>
          </div>

          {/* Desktop Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1">
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
        </div>

        {/* Right Side: Actions */}
        <button 
          type="button" 
          className="relative inline-flex items-center justify-center size-10 rounded-full text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Bell className="size-5" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-[#F6F8FC]"></span>
        </button>
      </div>
    </header>
  );
}
