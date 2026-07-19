"use client";

import React, { useRef, useEffect, useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/admin/AuthContext";

export function AdminProfileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="hidden lg:flex items-center gap-3 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900 leading-none dark:text-slate-50">{currentUser?.name || "Admin"}</p>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400 capitalize">{currentUser?.role?.replace("_", " ") || "Admin"}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300 hover:ring-2 hover:ring-blue-100 dark:hover:ring-blue-500/20 transition-all">
          {currentUser?.avatarInitials || "AD"}
        </div>
      </div>

      {/* Mobile view profile icon */}
      <div className="lg:hidden flex" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
          {currentUser?.avatarInitials || "AD"}
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
            animate={{ clipPath: "circle(400px at calc(100% - 20px) 20px)", opacity: 1 }}
            exit={{ clipPath: "circle(0px at calc(100% - 20px) 20px)", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-xl backdrop-blur-3xl transition-colors duration-300 z-50"
          >
            <div className="px-3 py-3 text-sm text-slate-500 font-medium border-b border-slate-100 mb-2 dark:border-slate-700 dark:text-slate-400">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1 dark:text-slate-500">Signed in as Admin</p>
              <p className="text-slate-800 font-bold text-base truncate dark:text-slate-100">{currentUser?.name || "Admin"}</p>
              <p className="text-[11px] mt-0.5 text-blue-600 dark:text-blue-400 font-semibold capitalize">{currentUser?.role?.replace("_", " ") || "Admin"}</p>
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                router.push("/admin/settings");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" /> Admin Settings
            </button>
            <button
              onClick={async () => {
                setIsMenuOpen(false);
                try {
                  await logout();
                  toast.success("Admin logged out");
                  router.push("/");
                } catch {
                  toast.error("Unable to log out. Please try again.");
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
