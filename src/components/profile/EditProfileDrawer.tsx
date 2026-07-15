import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { MemberProfileData } from "./MemberProfileDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfileData;
  onSave: (updatedMember: MemberProfileData) => Promise<void> | void;
}

export function EditProfileDrawer({ isOpen, onClose, member, onSave }: EditProfileDrawerProps) {
  const [formData, setFormData] = useState<MemberProfileData>(member);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form data when the drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData(member);
      setErrors({});
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    
    const phoneRegex = /^\+?91\s?\d{10}$|^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Enter a valid 10-digit number";
    }
    
    if (!phoneRegex.test(formData.whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = "Enter a valid 10-digit number";
    }

    if (!formData.age || formData.age < 1) newErrors.age = "Valid age is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsSaving(true);
        await onSave(formData);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end md:justify-center md:items-center md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div 
        className="relative bg-white w-full md:w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 dark:border dark:border-slate-700 dark:bg-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 shrink-0 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Edit Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your personal information</p>
          </div>
          <button 
            onClick={onClose}
            className="size-11 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-slate-500 flex items-center justify-center transition-all hover:scale-105 hover:bg-white hover:text-slate-900 shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20 ${errors.name ? 'border-red-300 focus:border-red-500 dark:border-red-500/60' : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'}`}
                />
                {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.name}</p>}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Age</label>
                <input 
                  type="number" 
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20 ${errors.age ? 'border-red-300 focus:border-red-500 dark:border-red-500/60' : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'}`}
                />
                {errors.age && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.age}</p>}
              </div>

              {/* Blood Group */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Blood Group</label>
                <Select value={formData.bloodGroup} onValueChange={(val) => handleSelectChange("bloodGroup", val)}>
                  <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+ve">A+</SelectItem>
                    <SelectItem value="O+ve">O+</SelectItem>
                    <SelectItem value="B+ve">B+</SelectItem>
                    <SelectItem value="AB+ve">AB+</SelectItem>
                    <SelectItem value="A-ve">A-</SelectItem>
                    <SelectItem value="O-ve">O-</SelectItem>
                    <SelectItem value="B-ve">B-</SelectItem>
                    <SelectItem value="AB-ve">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20 ${errors.phone ? 'border-red-300 focus:border-red-500 dark:border-red-500/60' : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'}`}
                />
                {errors.phone && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.phone}</p>}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">WhatsApp Number</label>
                <input 
                  type="text" 
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20 ${errors.whatsapp ? 'border-red-300 focus:border-red-500 dark:border-red-500/60' : 'border-slate-200 focus:border-blue-500 dark:border-slate-700'}`}
                />
                {errors.whatsapp && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> {errors.whatsapp}</p>}
              </div>

              {/* Occupation */}
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Occupation</label>
                <input 
                  type="text" 
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20"
                />
              </div>

              {/* Address */}
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Address / House Name</label>
                <textarea 
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e: any) => handleChange(e)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20"
                />
              </div>

              {/* Unit & Sector (Read-only since it's administrative) */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                  Unit
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Locked</span>
                </label>
                <input 
                  type="text" 
                  value={formData.unit}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-sm font-semibold text-slate-900 flex items-center justify-between">
                  Sector
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Locked</span>
                </label>
                <input 
                  type="text" 
                  value={formData.sector}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-slate-100 shrink-0 bg-white md:rounded-b-3xl dark:border-slate-700 dark:bg-slate-800">
          <button 
            form="edit-profile-form"
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save className="size-5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
