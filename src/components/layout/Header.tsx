"use client";

import React, { useState, useEffect, useRef } from "react";
import { TransparentLogo } from "@/components/TransparentLogo";
import { User, Settings, LogOut, Menu, X, LogIn } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { AuthSessionDTO } from "@/lib/backend/dto/auth.dto";
import { getCurrentSession, logoutSession } from "@/lib/api/authClient";

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<AuthSessionDTO | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then((currentSession) => {
        if (active) setSession(currentSession);
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    if (!session) return;
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    try {
      await logoutSession();
      setSession(null);
      toast.success("Logged out successfully");
      router.push("/");
    } catch {
      toast.error("Unable to log out. Please try again.");
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/45 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl py-2"
          : "border-b border-transparent bg-transparent py-4"
      }`}
    >
      <div className="container flex items-center justify-between px-4 md:px-8">
        
        {/* LOGO: (Left on Mobile and Desktop) */}
        <div className="flex items-center gap-2 md:gap-3 font-semibold mr-auto">
          <TransparentLogo
            src="/logo/atiyya-logo-icon.png"
            alt="Atiyya Logo"
            className={`w-auto object-contain drop-shadow-sm transition-all duration-300 scale-125 origin-left ${isScrolled ? "h-8 md:h-10" : "h-11 md:h-12"}`}
          />
        </div>

        {/* DESKTOP: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700 mx-6">
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link href="/services" className="hover:text-blue-600 transition-colors">
            Services
          </Link>
          <Link href="/contribution-details" className="hover:text-blue-600 transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </nav>

        {/* DESKTOP: User Menu */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/40 shadow-sm backdrop-blur-md hover:bg-white/60 transition-colors"
            >
              <User className="h-5 w-5 text-slate-700" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                  animate={{ clipPath: "circle(400px at calc(100% - 20px) 20px)", opacity: 1 }}
                  exit={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/60 bg-white/70 p-2 shadow-[0_32px_80px_rgba(37,99,235,0.12)] backdrop-blur-3xl"
                >
                  <div className="px-3 py-3 text-sm text-slate-500 font-medium border-b border-white/50 mb-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">{session ? "Welcome back," : "Not signed in"}</p>
                    <p className="text-slate-800 font-bold text-base truncate">{session?.actorName ?? "Guest"}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!session}
                    title={session ? "Open settings" : "Log in to open settings"}
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push(session?.actorType === "admin" ? "/admin/settings" : "/member/profile");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white/60 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button
                    type="button"
                    disabled={!session}
                    title={session ? "Log out" : "No active session"}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors mt-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MOBILE: Menu Toggle (Right) */}
        <div className="md:hidden flex items-center relative" ref={mobileMenuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/40 shadow-sm backdrop-blur-md hover:bg-white/60 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
          </button>
          
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                animate={{ clipPath: "circle(800px at calc(100% - 20px) 20px)", opacity: 1 }}
                exit={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute right-0 top-12 mt-3 w-64 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_32px_80px_rgba(37,99,235,0.12)] backdrop-blur-3xl flex flex-col gap-2"
              >
                <div className="px-2 pb-3 mb-2 border-b border-slate-200">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">{session ? "Welcome back," : "Not signed in"}</p>
                  <p className="text-slate-800 font-bold text-base truncate">{session?.actorName ?? "Guest"}</p>
                </div>
                
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                  About
                </Link>
                <Link href="/services" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                  Services
                </Link>
                <Link href="/contribution-details" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                  Pricing
                </Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                  Contact
                </Link>

                <div className="h-px bg-slate-200 my-2" />

                {session ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push(session.actorType === "admin" ? "/admin/settings" : "/member/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <LogIn className="h-4 w-4" /> Login
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
