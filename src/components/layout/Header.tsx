"use client";

import React, { useState, useEffect, useRef } from "react";
import { TransparentLogo } from "@/components/TransparentLogo";
import { User, Settings, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AuthSessionDTO } from "@/lib/backend/dto/auth.dto";
import { getCurrentSession, logoutSession } from "@/lib/api/authClient";

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<AuthSessionDTO | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Check on initial load
    handleScroll();

    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
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

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/45 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl py-2"
          : "border-b border-transparent bg-transparent py-4"
      }`}
    >
      <div className="container flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-3 font-semibold">
          <TransparentLogo
            src="/logo/logo-transparent.svg"
            alt="SSF Logo"
            className={`w-auto object-contain drop-shadow-sm transition-all duration-300 ${isScrolled ? "h-8 md:h-10" : "h-10 md:h-14"}`}
          />
          <span className={`inline-block font-extrabold tracking-[-0.02em] text-slate-950 transition-all duration-300 ${isScrolled ? "text-base md:text-xl" : "text-lg md:text-2xl"}`}>
            <span className="font-cooper font-normal">SSF</span> Alparamba Unit
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* User Menu */}
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
                    onClick={async () => {
                      if (!session) return;
                      setIsMenuOpen(false);
                      try {
                        await logoutSession();
                        setSession(null);
                        toast.success("Logged out successfully");
                        router.push("/");
                      } catch {
                        toast.error("Unable to log out. Please try again.");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors mt-1 disabled:cursor-not-allowed disabled:opacity-50"
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
