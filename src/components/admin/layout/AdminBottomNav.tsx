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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 shadow-[0_-8px_30px_rgb(0,0,0,0.05)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-16 h-14 transition-all active:scale-95"
            >
              <div className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              )}>
                <div className={cn(
                  "flex items-center justify-center px-4 py-1 rounded-full mb-1 transition-all",
                  isActive ? "bg-blue-100/50 dark:bg-blue-900/50" : ""
                )}>
                  <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
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
          className="flex flex-col items-center justify-center w-16 h-14 transition-all active:scale-95"
        >
          <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
            <div className="flex items-center justify-center px-4 py-1 rounded-full mb-1 transition-all">
              <Menu className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium tracking-wide">
              Menu
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
