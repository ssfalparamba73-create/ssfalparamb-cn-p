import { PublicBannerManager } from "@/components/admin/settings/PublicBannerManager";

export const metadata = {
  title: "Dashboard Banner | SSF Alparamba Admin",
  description: "Manage the image displayed on the member dashboard.",
};

export default function DashboardBannerSettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Dashboard Banner
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Upload the image shown near the top of the member dashboard.
        </p>
      </div>
      <PublicBannerManager />
    </div>
  );
}
