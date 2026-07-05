import { ShieldCheck, CalendarRange } from "lucide-react";
import { TransactionCard, Transaction } from "@/components/payments/TransactionCard";

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    date: "July 2, 2026",
    amount: 100,
    method: "UPI",
    status: "COMPLETED",
    receiptUrl: "/receipt/tx_1?method=UPI&admin=Admin&phone=Member"
  },
  {
    id: "tx_2",
    date: "June 1, 2026",
    amount: 100,
    method: "CASH",
    status: "COMPLETED",
    receiptUrl: "/receipt/tx_2?method=CASH&admin=Farhan%20(President)&phone=Member"
  },
  {
    id: "tx_3",
    date: "May 5, 2026",
    amount: 150,
    method: "UPI",
    status: "COMPLETED",
    receiptUrl: "/receipt/tx_3?method=UPI&admin=Admin&phone=Member"
  },
];

export default function PaymentsPage() {
  const totalPaid = MOCK_TRANSACTIONS.reduce((sum, tx) => sum + (tx.status === "COMPLETED" ? tx.amount : 0), 0);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#F6F8FC] animate-in fade-in duration-300 pb-24 md:pb-6">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payments History</h1>
        <p className="text-slate-500 text-sm">View your past transactions and receipts.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5EAF3] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5">
              <ShieldCheck className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Active Member</span>
            </div>
          </div>
          <span className="text-slate-500 font-medium mb-1">Total Amount Paid</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl md:text-5xl font-black text-slate-900">₹{totalPaid}</span>
            <span className="text-slate-400 text-sm font-medium">this year</span>
          </div>
        </div>
        
        {/* Visual Graphic for desktop to fill empty space elegantly */}
        <div className="hidden md:flex size-24 bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 rounded-full items-center justify-center shrink-0 transition-all hover:-translate-y-1">
          <CalendarRange className="size-10" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Recent Transactions
          <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">{MOCK_TRANSACTIONS.length}</span>
        </h2>
        
        <div className="flex flex-col gap-3">
          {MOCK_TRANSACTIONS.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>

    </div>
  );
}
