"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, Banknote, Calendar, Activity, Droplet, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { CollectionTrendChart } from "@/components/admin/dashboard/CollectionTrendChart";
import { PaymentMethodChart } from "@/components/admin/dashboard/PaymentMethodChart";

const MOCK_COLLECTION_TREND = [
  { month: "Jan", amount: 15000 },
  { month: "Feb", amount: 18000 },
  { month: "Mar", amount: 12000 },
  { month: "Apr", amount: 25000 },
  { month: "May", amount: 30000 },
  { month: "Jun", amount: 22000 },
];

const MOCK_PAYMENT_METHODS = [
  { method: "Cash", percentage: 40, color: "bg-emerald-500" },
  { method: "UPI", percentage: 45, color: "bg-blue-500" },
  { method: "Bank Transfer", percentage: 15, color: "bg-amber-500" },
];

export function ReportsDashboard() {
  const [reportType, setReportType] = useState("monthly");

  const handleExportPDF = () => {
    toast.success("Generating PDF report...");
  };

  const handleExportCSV = () => {
    toast.success("Downloading CSV file...");
    // Dummy download logic for frontend demo
    const element = document.createElement("a");
    const file = new Blob(["id,name,amount\n1,Dummy,100"], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = `report_${reportType}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderContent = () => {
    switch (reportType) {
      case "monthly":
      case "dues":
      case "events":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <CollectionTrendChart data={MOCK_COLLECTION_TREND} />
            <PaymentMethodChart data={MOCK_PAYMENT_METHODS} />
          </div>
        );
      case "method":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <PaymentMethodChart data={MOCK_PAYMENT_METHODS} />
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900/50">
               <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">Most Popular Method</h3>
               <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                 <Wallet className="w-12 h-12" />
               </div>
               <p className="text-2xl font-bold">UPI Payments</p>
               <p className="text-slate-500 mt-2 text-center">45% of all transactions this month were processed via UPI.</p>
            </Card>
          </div>
        );
      case "cash":
        return (
          <div className="animate-in fade-in duration-300">
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                 <Banknote className="w-5 h-5 text-emerald-500" /> Cash Ledger Summary
               </h3>
               <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 border border-emerald-100 dark:border-emerald-800/50">
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Cash in Hand</p>
                     <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1">₹14,500</p>
                   </div>
                   <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
                     Settle to Bank
                   </Button>
                 </div>
               </div>
               <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                     <div>
                       <p className="font-medium text-slate-900 dark:text-slate-100">Received from Farhan (Admin)</p>
                       <p className="text-xs text-slate-500">Jul {10-i}, 2026 - Monthly Dues Collection</p>
                     </div>
                     <p className="font-mono font-medium text-emerald-600 dark:text-emerald-400">+₹{i * 1500}</p>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        );
      case "defaulters":
        return (
          <div className="animate-in fade-in duration-300">
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-red-50/50 dark:bg-red-900/10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
                   <AlertCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Defaulters Summary</h3>
                   <p className="text-sm text-slate-500">Overview of pending dues</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                   <p className="text-sm text-slate-500 mb-1">Total Pending</p>
                   <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">₹8,450</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                   <p className="text-sm text-slate-500 mb-1">Members Overdue</p>
                   <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">24</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                   <p className="text-sm text-slate-500 mb-1">Severe Defaulters</p>
                   <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">7</p>
                 </div>
               </div>
               <Button className="w-full bg-red-600 hover:bg-red-700 text-white">View Full Defaulters List</Button>
            </Card>
          </div>
        );
      case "donors":
        return (
          <div className="animate-in fade-in duration-300">
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-red-100 text-red-500 rounded-full dark:bg-red-900/30 dark:text-red-400">
                   <Droplet className="w-6 h-6 fill-red-100 dark:fill-red-900/50 text-red-500" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Blood Donor Analytics</h3>
                   <p className="text-sm text-slate-500">Availability by Blood Group</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {([
                   { group: "O+", count: 8 },
                   { group: "A+", count: 5 },
                   { group: "B+", count: 7 },
                   { group: "AB+", count: 3 },
                   { group: "O-", count: 4 },
                   { group: "A-", count: 2 },
                   { group: "B-", count: 6 },
                   { group: "AB-", count: 2 },
                 ] as { group: string; count: number }[]).map(({ group, count }) => (
                   <div key={group} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                     <span className="text-lg font-bold text-red-500 dark:text-red-400 mb-2">{group}</span>
                     <span className="text-2xl font-mono text-slate-900 dark:text-slate-100">{count}</span>
                     <span className="text-xs text-slate-500 mt-1">Available</span>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        );
      case "admin":
        return (
          <div className="animate-in fade-in duration-300">
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-slate-100 text-slate-600 rounded-full dark:bg-slate-800 dark:text-slate-400">
                   <Activity className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Admin Activity Log</h3>
                   <p className="text-sm text-slate-500">Recent actions performed by administrators</p>
                 </div>
               </div>

               <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                 {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                       <Users className="w-4 h-4" />
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                       <div className="flex items-center justify-between mb-1">
                         <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Shibili N added a member</h4>
                         <time className="text-xs text-slate-500">{i * 2} hours ago</time>
                       </div>
                       <p className="text-sm text-slate-600 dark:text-slate-400">Member details for &quot;Afsal T&quot; updated successfully.</p>
                     </div>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:min-w-[240px]">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Select Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Collection Summary</SelectItem>
                <SelectItem value="dues">Dues Collection Report</SelectItem>
                <SelectItem value="events">Special Events Report</SelectItem>
                <SelectItem value="method">Payment Method Split</SelectItem>
                <SelectItem value="cash">Cash Ledger</SelectItem>
                <SelectItem value="defaulters">Pending Dues Report</SelectItem>
                <SelectItem value="donors">Blood Donors Analytics</SelectItem>
                <SelectItem value="admin">Admin Activity Log</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:min-w-[160px]">
            <Select defaultValue="july-2026">
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="july-2026">July 2026</SelectItem>
                <SelectItem value="june-2026">June 2026</SelectItem>
                <SelectItem value="may-2026">May 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
          <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button onClick={handleExportCSV} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats (Visible for general reports) */}
      {(reportType === "monthly" || reportType === "dues" || reportType === "events") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Collected</h3>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">₹45,200</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% from last month
            </div>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Dues</h3>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">₹25,000</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">55% of total</div>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Special Events</h3>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">₹20,200</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">45% of total</div>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Paid Members</h3>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">125</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">82% collection rate</div>
          </Card>
        </div>
      )}

      {/* Dynamic Content Based on Report Type */}
      {renderContent()}
    </div>
  );
}
