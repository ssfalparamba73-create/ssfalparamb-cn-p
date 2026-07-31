"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminBottomNav } from "./AdminBottomNav";
import { useAuth } from "@/lib/admin/AuthContext";
import { canAccessAdminPath } from "@/lib/admin/accessControl";
import { cn } from "@/lib/utils";
import { PageContentSkeleton } from "@/components/ui/loading-skeletons";
import { scheduleAdminPriorityPrefetch } from "@/lib/client/adminPrefetch";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const canAccess = Boolean(
    currentUser && canAccessAdminPath(currentUser.permissions, pathname)
  );

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!canAccess) router.replace("/admin/dashboard");
  }, [canAccess, currentUser, isLoading, pathname, router]);

  useEffect(() => {
    if (!currentUser) return;
    return scheduleAdminPriorityPrefetch(currentUser.permissions);
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-50">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((value) => !value)}
      />
      <AdminMobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <AdminBottomNav 
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)} 
      />
      
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          isSidebarCollapsed ? "lg:pl-12" : "lg:pl-64"
        )}
      >
        <AdminTopbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 pb-24 lg:pb-8 lg:p-8 max-w-[1440px] w-full mx-auto">
          {isLoading ? <PageContentSkeleton /> : canAccess ? children : null}
        </main>
      </div>
    </div>
  );
}
