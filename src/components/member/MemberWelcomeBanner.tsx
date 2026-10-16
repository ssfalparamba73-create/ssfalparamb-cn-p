"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicBannerQuery } from "@/lib/client/memberQueries";

interface MemberWelcomeBannerProps {
  compact?: boolean;
  onDismiss: () => void;
}

export function MemberWelcomeBanner({ compact = false, onDismiss }: MemberWelcomeBannerProps) {
  const { data: banner } = useQuery(publicBannerQuery);

  return (
    <section
      aria-label="SSF Alparamba community welcome"
      className={`relative isolate aspect-[16/9] w-full overflow-hidden border border-[#D9E2EC] bg-[#172554] shadow-sm dark:border-slate-700 ${compact ? "rounded-[18px]" : "rounded-3xl"}`}
    >
      <Image
        src={banner?.url ?? "/social/ssf-alparamba-share.png"}
        alt="SSF Alparamba community portal"
        fill
        sizes={compact ? "(max-width: 767px) 100vw, 50vw" : "50vw"}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-transparent" aria-hidden="true" />
      <button
        type="button"
        aria-label="Hide community banner"
        onClick={onDismiss}
        className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/40 bg-slate-950/45 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-950/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </section>
  );
}
