"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, User, Users } from "lucide-react";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

export function MemberBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/member/dashboard",
      icon: LayoutDashboard,
    },
    ...(MEMBER_PAYMENTS_ENABLED ? [{
      name: "Payments",
      href: "/member/payments",
      icon: History,
    }] : []),
    {
      name: "Community",
      href: "/member/directory",
      icon: Users,
    },
    {
      name: "Profile",
      href: "/member/profile",
      icon: User,
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5EAF3] pb-safe transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-[#2563EB] dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <div className={`relative p-1 rounded-full transition-all ${isActive ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                <Icon className={`size-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
