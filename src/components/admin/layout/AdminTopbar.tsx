"use client";

import React, { useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { AdminActionIcon } from "./AdminActionIcon";
import { useTheme } from "next-themes";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminSearchModal } from "./AdminSearchModal";
import { AdminNotificationMenu } from "./AdminNotificationMenu";
import { AdminProfileMenu } from "./AdminProfileMenu";

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export function AdminTopbar({ onOpenMobileMenu, title = "Admin Panel" }: AdminTopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  React.useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#F6F8FC] px-4 lg:px-8 border-b border-[#E5EAF3] transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          
          {/* Breadcrumbs for Desktop, Title for Mobile fallback */}
          <div className="hidden sm:block">
            <AdminBreadcrumbs />
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Icon */}
          <div onClick={() => setIsSearchOpen(true)}>
            <AdminActionIcon aria-label="Search" className="cursor-pointer">
              <Search className="w-5 h-5" />
            </AdminActionIcon>
          </div>
          
          {/* Notifications Menu */}
          <AdminNotificationMenu />

          {/* Theme Toggle */}
          <AdminActionIcon
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hidden sm:flex"
          >
            {isThemeMounted && isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </AdminActionIcon>

          {/* Profile Menu */}
          <div className="ml-1 pl-2 md:ml-2 md:pl-4 border-l border-slate-200 dark:border-slate-700">
            <AdminProfileMenu />
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AdminSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
