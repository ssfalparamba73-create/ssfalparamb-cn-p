"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminBottomNav } from "./AdminBottomNav";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-50">
      <AdminSidebar />
      <AdminMobileDrawer 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <AdminBottomNav 
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)} 
      />
      
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        <AdminTopbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 pb-24 lg:pb-8 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
