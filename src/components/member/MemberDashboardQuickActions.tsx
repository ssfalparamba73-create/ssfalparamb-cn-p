"use client";

import Link from "next/link";
import { CreditCard, History, UserRound, UsersRound } from "lucide-react";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

const ACTIONS = [
  ...(MEMBER_PAYMENTS_ENABLED ? [{ label: "Pay Now", shortLabel: "Pay", href: "/pay?source=member", Icon: CreditCard }] : []),
  { label: "Community", shortLabel: "Community", href: "/member/directory", Icon: UsersRound },
  ...(MEMBER_PAYMENTS_ENABLED ? [{ label: "Payment History", shortLabel: "History", href: "/member/payments", Icon: History }] : []),
  { label: "Profile", shortLabel: "Profile", href: "/member/profile", Icon: UserRound },
];

export function MemberDashboardQuickActions({ compact = false }: { compact?: boolean }) {
  const headingId = compact ? "member-quick-actions-mobile-heading" : "member-quick-actions-desktop-heading";
  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800 dark:shadow-none ${compact ? "p-4" : "p-6"}`}
    >
      <h2 id={headingId} className="text-base font-semibold text-slate-900 dark:text-slate-50">
        {compact ? "Quick access" : "Your shortcuts"}
      </h2>
      <div className={`mt-4 grid ${ACTIONS.length === 4 ? "grid-cols-4" : "grid-cols-3"} ${compact ? "gap-1.5" : "gap-3"}`}>
        {ACTIONS.map(({ label, shortLabel, href, Icon }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className={`group flex min-w-0 flex-col items-center justify-center rounded-xl text-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700/60 ${compact ? "gap-2 px-1 py-2" : "gap-3 p-3"}`}
          >
            <span className={`flex items-center justify-center rounded-full bg-[#3159D9] text-white shadow-sm transition-transform group-hover:-translate-y-0.5 ${compact ? "size-11" : "size-14"}`}>
              <Icon className={compact ? "size-5" : "size-6"} aria-hidden="true" />
            </span>
            <span className={`max-w-full text-slate-700 dark:text-slate-200 ${compact ? "line-clamp-2 text-[10px] font-medium leading-tight" : "text-xs font-semibold"}`}>
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
