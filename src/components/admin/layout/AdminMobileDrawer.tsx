"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { X, LayoutDashboard, Users, Banknote, Wallet, AlertOctagon, BarChart3, Droplet, History, Settings, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminActionIcon } from "./AdminActionIcon";
import { useAuth } from "@/lib/admin/AuthContext";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Cash Entry", href: "/admin/cash-entry", icon: Banknote },
  { name: "Payments", href: "/admin/payments", icon: Wallet },
  { name: "Defaulters", href: "/admin/defaulters", icon: AlertOctagon },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Blood Donors", href: "/admin/blood-donors", icon: Droplet },
  { name: "Audit Log", href: "/admin/audit-log", icon: History },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminMobileDrawer({ isOpen, onClose }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { currentUser } = useAuth();

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full bg-white dark:bg-slate-900 max-h-[85vh] flex flex-col shadow-2xl rounded-t-3xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <span className="font-semibold text-lg text-slate-900 dark:text-slate-50">Menu</span>
          <AdminActionIcon onClick={onClose} aria-label="Close menu" className="h-8 w-8">
            <X className="w-4 h-4" />
          </AdminActionIcon>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
          {navItems.map((item) => {
            // Skip items that are already in the bottom nav to avoid redundancy, or show them all.
            // Let's show them all for a complete menu.
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-sm font-medium transition-all active:scale-95 border",
                  isActive
                    ? "bg-blue-50/50 text-blue-600 border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400"
                    : "bg-white text-slate-600 border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full",
                  isActive ? "bg-blue-100 dark:bg-blue-900/40" : "bg-slate-100 dark:bg-slate-800"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-none pb-8 sm:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800">
                {currentUser?.avatarInitials || "AD"}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-none">{currentUser?.name || "Admin"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{currentUser?.role?.replace("_", " ") || "Staff"}</p>
              </div>
            </div>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
