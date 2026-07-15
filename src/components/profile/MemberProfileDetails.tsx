import { User, Phone, MapPin, Droplet, Briefcase, Calendar, ShieldCheck, CreditCard, MessageCircle } from "lucide-react";

export interface MemberProfileData {
  id: string;
  name: string;
  initials: string;
  age: number;
  bloodGroup: string;
  phone: string;
  whatsapp: string;
  address: string;
  unit: string;
  sector: string;
  joinedYear: string;
  occupation: string;
}

interface MemberProfileDetailsProps {
  member: MemberProfileData;
}

export function MemberProfileDetails({ member }: MemberProfileDetailsProps) {
  return (
    <div className="bg-white rounded-3xl border border-[#E5EAF3] shadow-sm overflow-hidden mb-6 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      
      {/* Header section with Avatar */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-b border-[#E5EAF3] dark:border-slate-700 dark:from-blue-500/10 dark:to-slate-900">
        <div className="relative">
          <div className="size-24 md:size-28 bg-blue-600 text-white flex items-center justify-center rounded-full text-3xl font-bold shadow-md border-4 border-white">
            {member.initials}
          </div>
          <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
            <ShieldCheck className="size-4" />
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">{member.name}</h2>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-1.5 dark:text-slate-400">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide dark:bg-blue-500/10 dark:text-blue-300">
              Member Code: {member.id}
            </span>
            • {member.unit} Unit
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="p-6 md:p-8">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-50">
          <User className="size-4 text-blue-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8">
          <DetailItem colorScheme="red" icon={<Droplet className="size-5" />} label="Blood Group" value={member.bloodGroup} />
          <DetailItem colorScheme="purple" icon={<Calendar className="size-5" />} label="Age" value={`${member.age} Years`} />
          <DetailItem colorScheme="amber" icon={<Briefcase className="size-5" />} label="Occupation" value={member.occupation} />
          <DetailItem colorScheme="emerald" icon={<MapPin className="size-5" />} label="Address" value={member.address} />
        </div>

        <div className="h-px bg-[#E5EAF3] w-full mb-8 dark:bg-slate-700" />

        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-50">
          <Phone className="size-4 text-blue-600" />
          Contact Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8">
          <DetailItem colorScheme="blue" icon={<Phone className="size-5" />} label="Phone Number" value={member.phone} />
          <DetailItem colorScheme="whatsapp" icon={<MessageCircle className="size-5" />} label="WhatsApp" value={member.whatsapp} />
        </div>

        <div className="h-px bg-[#E5EAF3] w-full mb-8 dark:bg-slate-700" />

        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 dark:text-slate-50">
          <ShieldCheck className="size-4 text-blue-600" />
          Organization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <DetailItem colorScheme="indigo" icon={<CreditCard className="size-5" />} label="Member Code" value={member.id} />
          <DetailItem colorScheme="teal" icon={<MapPin className="size-5" />} label="Unit & Sector" value={`${member.unit}, ${member.sector}`} />
          <DetailItem colorScheme="orange" icon={<Calendar className="size-5" />} label="Joined Year" value={member.joinedYear} />
        </div>
      </div>
      
    </div>
  );
}

type ColorScheme = "slate" | "red" | "blue" | "emerald" | "amber" | "purple" | "indigo" | "teal" | "orange" | "whatsapp";

function DetailItem({ icon, label, value, colorScheme = "slate" }: { icon: React.ReactNode, label: string, value: string, colorScheme?: ColorScheme }) {
  const colors = {
    slate: "bg-slate-50 text-slate-500 border-slate-200",
    red: "bg-red-50 text-red-500 border-red-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-500 border-emerald-100",
    amber: "bg-amber-50 text-amber-500 border-amber-100",
    purple: "bg-purple-50 text-purple-500 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-500 border-indigo-100",
    teal: "bg-teal-50 text-teal-500 border-teal-100",
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    whatsapp: "bg-[#ebf8ee] text-[#25D366] border-[#25D366]/20"
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className={`size-11 rounded-full border shadow-[0_4px_12px_rgba(15,23,42,0.06)] flex items-center justify-center shrink-0 transition-all group-hover:-translate-y-0.5 ${colors[colorScheme]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500 font-medium mb-0.5 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</span>
      </div>
    </div>
  );
}
