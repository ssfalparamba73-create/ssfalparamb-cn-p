"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Banknote, CalendarDays, Phone, ChevronRight, Building, Lock } from "lucide-react";
import Link from "next/link";

const SETTINGS_PAGES = [
  {
    title: "Unit Settings",
    description: "Update the unit name, logo, branch, and official contact details.",
    icon: <Building className="w-6 h-6" />,
    href: "/admin/settings/unit",
    color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20",
  },
  {
    title: "Receipt Settings",
    description: "Customize the design, layout, and background of the payment receipt.",
    icon: <Banknote className="w-6 h-6" />,
    href: "/admin/settings/receipt",
    color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
  },
  {
    title: "Admin Users",
    description: "Manage admin access, assign roles, and handle Super Admin privileges.",
    icon: <ShieldCheck className="w-6 h-6" />,
    href: "/admin/settings/admins",
    color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
  },
  {
    title: "Security & PIN Rules",
    description: "Configure member login PIN lengths, expiry, and authentication rules.",
    icon: <Lock className="w-6 h-6" />,
    href: "/admin/settings/security",
    color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20",
  },
  {
    title: "Payment Configuration",
    description: "Configure UPI, QR codes, monthly dues minimums, and receipt settings.",
    icon: <Banknote className="w-6 h-6" />,
    href: "/admin/settings/payments",
    color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
  },
  {
    title: "Special Events",
    description: "Create and manage active donation campaigns and special events.",
    icon: <CalendarDays className="w-6 h-6" />,
    href: "/admin/settings/events",
    color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
  },
  {
    title: "Support Contacts",
    description: "Manage admin contact numbers shown to members in their profile.",
    icon: <Phone className="w-6 h-6" />,
    href: "/admin/settings/support-contacts",
    color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
  },
];

export function SettingsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SETTINGS_PAGES.map((page) => (
        <Link href={page.href} key={page.title} className="block group">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-800/50 transition-all flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${page.color}`}>
              {page.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {page.title}
                </h3>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {page.description}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
