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
    <div className="bg-white rounded-3xl border border-[#E5EAF3] shadow-sm overflow-hidden mb-6">
      
      {/* Header section with Avatar */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-b border-[#E5EAF3]">
        <div className="relative">
          <div className="size-24 md:size-28 bg-blue-600 text-white flex items-center justify-center rounded-full text-3xl font-bold shadow-md border-4 border-white">
            {member.initials}
          </div>
          <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
            <ShieldCheck className="size-4" />
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{member.name}</h2>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-1.5">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
              ID: {member.id}
            </span>
            • {member.unit} Unit
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="p-6 md:p-8">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User className="size-4 text-blue-600" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8">
          <DetailItem icon={<Droplet className="size-4 text-red-500" />} label="Blood Group" value={member.bloodGroup} />
          <DetailItem icon={<Calendar className="size-4 text-slate-400" />} label="Age" value={`${member.age} Years`} />
          <DetailItem icon={<Briefcase className="size-4 text-slate-400" />} label="Occupation" value={member.occupation} />
          <DetailItem icon={<MapPin className="size-4 text-slate-400" />} label="Address" value={member.address} />
        </div>

        <div className="h-px bg-[#E5EAF3] w-full mb-8" />

        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Phone className="size-4 text-blue-600" />
          Contact Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8">
          <DetailItem icon={<Phone className="size-4 text-slate-400" />} label="Phone Number" value={member.phone} />
          <DetailItem icon={<MessageCircle className="size-4 text-[#25D366]" />} label="WhatsApp" value={member.whatsapp} />
        </div>

        <div className="h-px bg-[#E5EAF3] w-full mb-8" />

        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="size-4 text-blue-600" />
          Organization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <DetailItem icon={<CreditCard className="size-4 text-slate-400" />} label="Membership ID" value={member.id} />
          <DetailItem icon={<MapPin className="size-4 text-slate-400" />} label="Unit & Sector" value={`${member.unit}, ${member.sector}`} />
          <DetailItem icon={<Calendar className="size-4 text-slate-400" />} label="Joined Year" value={member.joinedYear} />
        </div>
      </div>
      
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500 font-medium mb-0.5">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>
    </div>
  );
}
