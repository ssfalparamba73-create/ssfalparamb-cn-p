"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Banknote, Calendar, Download, FileText, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollectionTrendChart } from "@/components/admin/dashboard/CollectionTrendChart";
import { PaymentMethodChart } from "@/components/admin/dashboard/PaymentMethodChart";
import { getAdminPayments } from "@/lib/api/adminPaymentClient";
import type { PaymentDTO } from "@/lib/backend/dto/payment.dto";

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function ReportsDashboard() {
  const [reportType, setReportType] = useState("monthly");
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminPayments().then((result) => setPayments(result.items)).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Unable to load live report data.");
    }).finally(() => setIsLoading(false));
  }, []);

  const livePayments = useMemo(() => payments.filter((payment) => payment.status === "confirmed" && !payment.voidedAt), [payments]);
  const total = useMemo(() => livePayments.reduce((sum, payment) => sum + payment.amount, 0), [livePayments]);
  const duesTotal = useMemo(() => livePayments.filter((payment) => payment.category === "monthly_dues").reduce((sum, payment) => sum + payment.amount, 0), [livePayments]);
  const eventsTotal = total - duesTotal;
  const paidMembers = useMemo(() => new Set(livePayments.map((payment) => payment.memberId).filter(Boolean)).size, [livePayments]);
  const methodData = useMemo(() => {
    const methods = [
      ["Cash", ["cash_handover", "admin_cash_entry"], "bg-emerald-500"],
      ["UPI", ["upi", "qr_code"], "bg-blue-500"],
      ["Bank Transfer", ["bank_transfer"], "bg-amber-500"],
    ] as const;
    return methods.map(([method, values, color]) => ({
      method,
      color,
      percentage: total ? Math.round((livePayments.filter((payment) => (values as readonly string[]).includes(payment.method)).reduce((sum, payment) => sum + payment.amount, 0) / total) * 100) : 0,
    })).filter((item) => item.percentage > 0);
  }, [livePayments, total]);
  const trendData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    return { month: date.toLocaleString("en-IN", { month: "short" }), amount: livePayments.filter((payment) => monthKey(new Date(payment.paidAt || payment.recordedAt)) === key).reduce((sum, payment) => sum + payment.amount, 0) };
  }), [livePayments]);

  const handleExportCSV = () => {
    const rows = [["Receipt ID", "Payer", "Category", "Method", "Amount", "Status", "Date"], ...livePayments.map((payment) => [payment.receiptId, payment.payerName || payment.payerPhone, payment.category, payment.method, String(payment.amount), payment.status, payment.paidAt || payment.recordedAt])];
    const blob = new Blob([rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "ssf-payment-report.csv"; link.click(); URL.revokeObjectURL(url); toast.success("Live payment report downloaded.");
  };

  const emptyState = <Card className="p-8 text-center text-sm text-slate-500">No confirmed records are available for this report yet.</Card>;

  return <div className="space-y-6">
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        <Select value={reportType} onValueChange={setReportType}><SelectTrigger className="w-full sm:min-w-[240px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly Collection Summary</SelectItem><SelectItem value="method">Payment Method Split</SelectItem><SelectItem value="cash">Cash Ledger</SelectItem></SelectContent></Select>
        <div className="flex items-center rounded-md border border-slate-200 px-3 text-sm text-slate-600">Live records</div>
      </div>
      <Button onClick={handleExportCSV} className="w-full bg-blue-600 text-white sm:w-auto"><Download className="mr-2 size-4" />CSV</Button>
    </div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {isLoading ? <Card className="p-8 text-center text-sm text-slate-500">Loading live payment report…</Card> : <>
      {(reportType === "monthly" || reportType === "method") && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Banknote />} label="Total Collected" value={money(total)} />
        <Stat icon={<Calendar />} label="Monthly Dues" value={money(duesTotal)} />
        <Stat icon={<TrendingUp />} label="Special Events" value={money(eventsTotal)} />
        <Stat icon={<Users />} label="Paid Members" value={String(paidMembers)} />
      </div>}
      {reportType === "monthly" && <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><CollectionTrendChart data={trendData} /><PaymentMethodChart data={methodData.length ? methodData : [{ method: "No payments", percentage: 0, color: "bg-blue-500" }]} /></div>}
      {reportType === "method" && (methodData.length ? <PaymentMethodChart data={methodData} /> : emptyState)}
      {reportType === "cash" && (livePayments.some((payment) => ["cash_handover", "admin_cash_entry"].includes(payment.method)) ? <Card className="p-6"><h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><FileText className="size-5 text-emerald-500" />Live Cash Ledger</h3><div className="space-y-3">{livePayments.filter((payment) => ["cash_handover", "admin_cash_entry"].includes(payment.method)).map((payment) => <div key={payment.id} className="flex justify-between border-b border-slate-100 py-3"><span><b>{payment.payerName || payment.payerPhone}</b><br /><small className="text-slate-500">{payment.receiptId} · {new Date(payment.paidAt || payment.recordedAt).toLocaleDateString("en-IN")}</small></span><b className="text-emerald-600">+{money(payment.amount)}</b></div>)}</div></Card> : emptyState)}
    </>}
  </div>;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <Card className="p-5"><div className="mb-2 flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div><h3 className="text-sm font-medium text-slate-500">{label}</h3></div><div className="font-mono text-2xl font-bold text-slate-900">{value}</div></Card>;
}
