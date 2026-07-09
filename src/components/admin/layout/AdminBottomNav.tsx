"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Menu 
} from "lucide-react";

interface AdminBottomNavProps {
  onOpenMobileMenu: () => void;
}

export function AdminBottomNav({ onOpenMobileMenu }: AdminBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Payments", href: "/admin/payments", icon: Wallet },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 pointer-events-none">
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl flex items-center justify-between px-2 py-2 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all active:scale-95"
            >
              <div className={cn(
                "flex flex-col items-center justify-center w-full h-full rounded-xl transition-colors",
                isActive 
                  ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}>
                <Icon className={cn("w-5 h-5 mb-1 transition-transform", isActive ? "scale-110" : "")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide">
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Menu Trigger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-all active:scale-95"
        >
          <div className="flex flex-col items-center justify-center w-full h-full rounded-xl transition-colors">
            <Menu className="w-5 h-5 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-wide">
              Menu
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
