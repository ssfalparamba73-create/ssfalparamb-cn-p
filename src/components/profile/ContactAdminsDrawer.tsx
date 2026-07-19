import { X, MessageCircle } from "lucide-react";
import type { SupportContactDTO } from "@/lib/backend/dto/support.dto";

interface ContactAdminsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: SupportContactDTO[];
  isLoading?: boolean;
  error?: string | null;
}

export function ContactAdminsDrawer({ isOpen, onClose, contacts, isLoading, error }: ContactAdminsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center p-4 pb-8 md:justify-center md:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-6 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 dark:border dark:border-slate-700 dark:bg-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="size-10 bg-[#ebf8ee] text-[#25D366] rounded-xl flex items-center justify-center border border-[#25D366]/20">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Contact Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reach out to committee members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* List of Admins */}
        <div className="space-y-3">
          {isLoading && <p className="p-3 text-sm text-slate-500">Loading contacts...</p>}
          {error && <p className="p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          {!isLoading && !error && contacts.length === 0 && (
            <p className="p-3 text-sm text-slate-500">No active support contacts are available.</p>
          )}
          {contacts.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-slate-600 dark:hover:shadow-none">
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm dark:text-slate-50">{admin.name}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-max mt-1">{admin.role || "Committee"}</span>
              </div>

              <a
                href={`https://wa.me/${admin.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="size-10 rounded-full bg-[#ebf8ee] border border-[#25D366]/20 shadow-sm text-[#25D366] flex items-center justify-center hover:bg-[#d4f3dd] hover:-translate-y-0.5 transition-all"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
