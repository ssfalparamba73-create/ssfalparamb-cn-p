"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ChevronRight,
  LayoutDashboard, 
  Users, 
  Banknote, 
  Wallet, 
  AlertOctagon, 
  BarChart3, 
  Droplet, 
  History, 
  PanelLeft,
  Settings 
} from "lucide-react";
import { useAuth } from "@/lib/admin/AuthContext";
import { canAccessAdminPath } from "@/lib/admin/accessControl";
import { prefetchAdminRouteData } from "@/lib/client/adminPrefetch";

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

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const visibleItems = navItems.filter((item) =>
    canAccessAdminPath(currentUser?.permissions, item.href)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden h-svh flex-col border-r border-[#E2E8F0] bg-white text-slate-950 transition-[width] duration-200 ease-linear lg:flex dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        isCollapsed ? "w-12 items-center px-1.5 py-3" : "w-64 px-3 py-3"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-8 top-4 z-50 flex size-8 items-center justify-center rounded-md bg-transparent text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
      >
        <PanelLeft className="size-4" strokeWidth={2} />
      </button>

      <div
        className={cn(
          "mb-7 flex w-full items-center",
          isCollapsed ? "justify-center" : "justify-between gap-3"
        )}
      >
        <Link
          href="/admin/dashboard"
          className={cn("flex min-w-0 items-center gap-3", isCollapsed && "justify-center")}
          title="Atiyya Group"
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E2E8F0] dark:bg-slate-900 dark:ring-slate-800">
            <Image
              src="/logo/atiyya-logo-icon.png"
              alt="Atiyya Logo"
              width={28}
              height={28}
              className="size-7 object-contain"
              priority
            />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-slate-950 dark:text-slate-50">
                <span className="font-cooper">Atiyya</span> Alparamba
              </span>
              <span className="block truncate text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">
                Admin Panel
              </span>
            </span>
          )}
        </Link>
      </div>

      {!isCollapsed && (
        <div className="mb-2 px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Platform
        </div>
      )}

      <nav className={cn("flex flex-1 flex-col gap-1.5 overflow-y-auto", isCollapsed ? "items-center" : "w-full")}>
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              onMouseEnter={() => prefetchAdminRouteData(item.href, currentUser?.permissions ?? [])}
              onFocus={() => prefetchAdminRouteData(item.href, currentUser?.permissions ?? [])}
              className={cn(
                "group flex items-center text-sm transition-colors",
                isCollapsed
                  ? cn(
                      "size-9 justify-center rounded-xl",
                      isActive
                        ? "bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-50"
                    )
                  : cn(
                      "h-8 w-full gap-3 rounded-md px-1 font-medium",
                      isActive
                        ? "text-slate-950 dark:text-slate-50"
                        : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50"
                    )
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {isCollapsed ? (
                <span className="sr-only">{item.name}</span>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <ChevronRight className="size-4 shrink-0 text-slate-950 dark:text-slate-200" />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="mt-5 flex w-full items-center gap-3 border-t border-[#E2E8F0] px-1 pt-4 dark:border-slate-800">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {currentUser?.avatarInitials || "AD"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">{currentUser?.name || "Admin"}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {currentUser?.role?.replace("_", " ") || "Staff"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
