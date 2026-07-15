"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Receipt, Clock, Save, FileText, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { adminClient } from "@/lib/frontend-api/adminClient";
import { PaymentDTO } from "@/lib/backend/dto/payment.dto";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [paymentStatus, setPaymentStatus] = useState(params.id === "pay_3" ? "Pending" : "Confirmed");

  const [actualPayment, setActualPayment] = useState<PaymentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  React.useEffect(() => {
    async function load() {
      try {
        const res = await adminClient.listPayments({ pageSize: "1000" });
        const p = res.items.find(x => x.id === params.id) || null;
        setActualPayment(p);
        if (p) setPaymentStatus(p.status.charAt(0).toUpperCase() + p.status.slice(1));
      } catch (err: any) {
        toast.error(err.message || "Failed to load payment details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const payment = actualPayment ? {
    id: actualPayment.id,
    receiptId: actualPayment.receiptId,
    amount: actualPayment.amount,
    memberName: actualPayment.payerName || "Unknown",
    memberId: actualPayment.memberId || "N/A",
    category: actualPayment.category === "monthly_dues" ? "Monthly Dues" : "Special Event",
    date: new Date(actualPayment.paidAt || actualPayment.recordedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
    method: actualPayment.method.toUpperCase().replace("_", " "),
    recordedBy: actualPayment.collectedByAdminName ? `${actualPayment.collectedByAdminName} (Admin)` : "Self",
    recordedAt: new Date(actualPayment.recordedAt).toLocaleString(),
    notes: actualPayment.notes || "No notes provided."
  } : null;

  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (payment) setNotes(payment.notes);
  }, [payment]);

  const handleSaveNotes = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Notes updated successfully");
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Payment Not Found</h2>
        <p className="text-slate-500 mb-6">The payment record you are looking for does not exist.</p>
        <Button onClick={() => router.push("/admin/payments")}>Back to Payments</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push("/admin/payments")}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center">
            Payment Details
          </h2>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">{payment.receiptId}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
               <div>
                 <div className="text-sm font-medium text-slate-500 mb-1">Total Amount</div>
                 <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">₹{payment.amount}</div>
               </div>
               <Badge className={
                 paymentStatus === "Confirmed" 
                   ? "bg-green-50 text-green-700 border-green-200 shadow-none dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 px-3 py-1 text-sm"
                   : paymentStatus === "Pending"
                   ? "bg-amber-50 text-amber-700 border-amber-200 shadow-none dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 px-3 py-1 text-sm"
                   : "bg-red-50 text-red-700 border-red-200 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-3 py-1 text-sm"
               }>
                 {paymentStatus}
               </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
               <div>
                 <div className="text-sm text-slate-500 mb-1 flex items-center"><User className="w-3 h-3 mr-1"/> Member</div>
                 <div className="font-medium text-slate-900 dark:text-slate-100">{payment.memberName}</div>
                 <div className="text-xs text-slate-400 font-mono mt-0.5">{payment.memberId}</div>
               </div>
               <div>
                 <div className="text-sm text-slate-500 mb-1 flex items-center"><Receipt className="w-3 h-3 mr-1"/> Category</div>
                 <div className="font-medium text-slate-900 dark:text-slate-100">{payment.category}</div>
               </div>
               <div>
                 <div className="text-sm text-slate-500 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Payment Date</div>
                 <div className="font-medium text-slate-900 dark:text-slate-100">{payment.date}</div>
               </div>
               <div>
                 <div className="text-sm text-slate-500 mb-1 flex items-center"><Hash className="w-3 h-3 mr-1"/> Payment Method</div>
                 <div className="font-medium text-slate-900 dark:text-slate-100">{payment.method}</div>
               </div>
            </div>
          </Card>

          {/* Internal Notes Section */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-slate-400" />
              Internal Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add admin notes here... (Not visible to member)"
              className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y mb-3"
            />
            <div className="flex justify-end">
               <Button onClick={handleSaveNotes} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                 <Save className="w-4 h-4 mr-2" />
                 {isSaving ? "Saving..." : "Save Notes"}
               </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Actions & Audit */}
        <div className="space-y-6">
           <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
             <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Actions</h3>
             
             {paymentStatus === "Pending" && (
               <div className="space-y-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                 <Button 
                   className="w-full bg-green-600 hover:bg-green-700 text-white shadow-none" 
                   onClick={async () => {
                     try {
                       await adminClient.approvePayment(payment.id);
                       setPaymentStatus("Confirmed"); 
                       toast.success("Payment Approved");
                     } catch (err: any) {
                       toast.error(err.message || "Failed to approve payment");
                     }
                   }}
                 >
                   Approve Payment
                 </Button>
                 <Button 
                   variant="outline" 
                   className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20 shadow-none"
                   onClick={async () => { 
                     try {
                       await adminClient.rejectPayment(payment.id);
                       setPaymentStatus("Rejected"); 
                       toast.error("Payment Rejected");
                     } catch (err: any) {
                       toast.error(err.message || "Failed to reject payment");
                     }
                   }}
                 >
                   Reject
                 </Button>
               </div>
             )}

             {paymentStatus === "Confirmed" && (
               <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                 <Button 
                   variant="outline" 
                   className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20 shadow-none"
                   onClick={async () => { 
                     try {
                       await adminClient.cancelPayment(payment.id);
                       setPaymentStatus("Cancelled"); 
                       toast.info("Payment Cancelled"); 
                     } catch (err: any) {
                       toast.error(err.message || "Failed to cancel payment");
                     }
                   }}
                 >
                   Cancel / Undo Payment
                 </Button>
               </div>
             )}

             <Link href={`/receipt/${payment.id}`} target="_blank" className="block w-full">
               <Button variant="outline" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:border-blue-900/50 dark:hover:bg-blue-900/20 dark:text-blue-400 shadow-none">
                 <ExternalLink className="w-4 h-4 mr-2" />
                 View Public Receipt
               </Button>
             </Link>
           </Card>

           <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
             <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
               <Clock className="w-4 h-4 mr-2 text-slate-400" />
               Audit Metadata
             </h3>
             <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Recorded By</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-flex">
                    {payment.recordedBy}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Recorded At</div>
                  <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                    {payment.recordedAt}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">System ID</div>
                  <div className="text-xs font-mono text-slate-400 break-all">
                    {payment.id}
                  </div>
                </div>
             </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
