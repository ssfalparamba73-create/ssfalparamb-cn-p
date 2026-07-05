import { Download, Banknote, SmartphoneNfc, FileText } from "lucide-react";
import Link from "next/link";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  method: "UPI" | "CASH";
  status: "COMPLETED" | "PENDING" | "FAILED";
  receiptUrl?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5EAF3] p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Icon based on method */}
        <div className={`size-11 rounded-full border shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all hover:-translate-y-0.5 ${
          transaction.method === "UPI" ? "bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]" : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
        }`}>
          {transaction.method === "UPI" ? <SmartphoneNfc className="size-5" /> : <Banknote className="size-5" />}
        </div>
        
        {/* Details */}
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-lg">₹{transaction.amount}</span>
          <span className="text-xs text-slate-500 font-medium">
            {transaction.date} • {transaction.method === "UPI" ? "Online Transfer" : "Handover"}
          </span>
          {/* Status Badge (if not completed) */}
          {transaction.status !== "COMPLETED" && (
            <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 w-max px-2 py-0.5 rounded-full ${
              transaction.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            }`}>
              {transaction.status}
            </span>
          )}
        </div>
      </div>

      {/* Action: View Receipt */}
      {transaction.status === "COMPLETED" && transaction.receiptUrl && (
        <Link 
          href={transaction.receiptUrl}
          className="size-11 rounded-full bg-blue-50 border border-blue-100 shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-blue-600 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:bg-blue-100 shrink-0 ml-2"
          title="View Receipt"
        >
          <FileText className="size-5" />
        </Link>
      )}
    </div>
  );
}
