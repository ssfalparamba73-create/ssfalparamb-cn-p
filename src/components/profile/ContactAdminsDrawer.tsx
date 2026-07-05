import { X, MessageCircle } from "lucide-react";

export interface AdminContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

const MOCK_ADMINS: AdminContact[] = [
  { id: "1", name: "Farhan", role: "President", phone: "919876543210" },
  { id: "2", name: "Afsal KK", role: "Secretary", phone: "919876543211" },
  { id: "3", name: "Nabeel", role: "Treasurer", phone: "919876543212" },
];

interface ContactAdminsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactAdminsDrawer({ isOpen, onClose }: ContactAdminsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end items-center p-4 pb-8 md:justify-center md:p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-6 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="size-10 bg-[#ebf8ee] text-[#25D366] rounded-xl flex items-center justify-center border border-[#25D366]/20">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Contact Support</h3>
              <p className="text-xs text-slate-500">Reach out to committee members</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* List of Admins */}
        <div className="space-y-3">
          {MOCK_ADMINS.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50/50">
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm">{admin.name}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-max mt-1">{admin.role}</span>
              </div>
              
              <a 
                href={`https://wa.me/${admin.phone}`}
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
          className="w-full mt-6 py-3 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
