"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/layout/AdminLayoutShell";
import { AuthProvider } from "@/lib/admin/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-[#F6F8FC] transition-colors duration-300 dark:bg-slate-900">{children}</div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AuthProvider>
  );
}
