import { DueStatusCard } from "@/components/dashboard/DueStatusCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";

export default function MemberDashboardPage() {
  // In a real app, this would be fetched from the database
  const mockDueAmount = 100;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col mb-2">
        <span className="text-sm text-slate-500 font-medium leading-none mb-1.5">Welcome back,</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Safvan Alparamba</h1>
      </div>

      <DueStatusCard amountDue={mockDueAmount} />
      <RecentActivityCard />
    </div>
  );
}
