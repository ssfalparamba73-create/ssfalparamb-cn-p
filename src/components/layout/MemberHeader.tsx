"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Settings, LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth/SessionContext";
import { authClient } from "@/lib/frontend-api/authClient";

export function MemberHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { session, refreshSession } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsThemeMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/member/dashboard" },
    { name: "Community", href: "/member/directory" },
    { name: "Payments", href: "/member/payments" },
    { name: "Profile", href: "/member/profile" },
  ];

  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F8FC] border-b border-[#E5EAF3] transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full relative">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/logo/logo-transparent.svg" alt="SSF Logo" className="h-8 md:h-10 w-auto object-contain" />
          <span className="text-sm md:text-lg font-bold text-slate-900 tracking-tight transition-colors duration-300 dark:text-slate-50">
            <span className="font-cooper font-normal text-base md:text-[22px] mr-1">SSF</span>
            <span className="hidden sm:inline">Alparamba Unit</span>
            <span className="inline sm:hidden">Alparamba</span>
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
                    ? "bg-white text-[#2563EB] shadow-sm border border-[#E5EAF3] dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Actions (Avatar + Universal Bell) */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Universal Notification Bell */}
          <button 
            type="button" 
            className="relative size-10 md:size-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-slate-600 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Bell className="size-4.5 md:size-5" />
            <span className="absolute top-2 md:top-2.5 right-2 md:right-2.5 size-2 md:size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
          </button>

          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hidden md:flex size-11 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            {isThemeMounted && isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>

          {/* Desktop Name */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-bold text-slate-900 leading-none mb-1 transition-colors duration-300 dark:text-slate-50">{session?.name || "Member"}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none transition-colors duration-300 dark:text-slate-500">Member</span>
          </div>
          
          {/* Avatar with Dropdown (Mobile & Desktop) */}
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative size-10 flex items-center justify-center rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-sm shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all dark:border-slate-700 dark:bg-blue-500/15 dark:hover:ring-blue-500/20"
            >
              <span className="text-[13px] font-bold text-blue-700 dark:text-blue-300">{session?.name?.substring(0, 2).toUpperCase() || "ME"}</span>
            </div>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                  animate={{ clipPath: "circle(400px at calc(100% - 20px) 20px)", opacity: 1 }}
                  exit={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-white bg-white p-2 shadow-xl backdrop-blur-3xl transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="px-3 py-3 text-sm text-slate-500 font-medium border-b border-slate-100 mb-2 dark:border-slate-700 dark:text-slate-400">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1 dark:text-slate-500">Welcome back,</p>
                    <p className="text-slate-800 font-bold text-base truncate dark:text-slate-100">{session?.name || "Member"}</p>
                  </div>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700">
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button 
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await authClient.logout();
                      await refreshSession();
                      toast.success("Logged out successfully");
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
