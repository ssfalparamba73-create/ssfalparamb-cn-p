import { ReactNode } from "react";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { MemberBottomNav } from "@/components/layout/MemberBottomNav";
import { MemberAuthGuard } from "@/components/layout/MemberAuthGuard";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <MemberAuthGuard>
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col font-sans transition-colors duration-300 dark:bg-slate-900">
        <MemberHeader />
        
        {/* 
          Main content area 
          pb-24 ensures content is not hidden behind the bottom nav on mobile
        */}
        <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl pb-24 md:pb-8 transition-colors duration-300">
          {children}
        </main>

        <MemberBottomNav />
      </div>
    </MemberAuthGuard>
  );
}
