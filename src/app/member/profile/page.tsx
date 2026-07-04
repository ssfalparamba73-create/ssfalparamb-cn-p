"use client";

import { useState } from "react";
import { MemberProfileDetails, MemberProfileData } from "@/components/profile/MemberProfileDetails";
import { EditProfileDrawer } from "@/components/profile/EditProfileDrawer";
import { Fingerprint, MessageCircle, LogOut, ChevronRight, Edit3, CheckCircle2 } from "lucide-react";

const INITIAL_MOCK_MEMBER: MemberProfileData = {
  id: "SSF-ALP-104",
  name: "Safvan Alparamba",
  initials: "SA",
  age: 28,
  bloodGroup: "O+ve",
  phone: "+91 9876543211",
  whatsapp: "+91 9876543211",
  address: "Darul Falah, Alparamba, Kerala",
  unit: "Alparamba",
  sector: "Kodassery",
  joinedYear: "2020",
  occupation: "Software Engineer",
};

export default function ProfilePage() {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [member, setMember] = useState<MemberProfileData>(INITIAL_MOCK_MEMBER);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSaveProfile = (updatedMember: MemberProfileData) => {
    // Update initials based on new name
    const nameParts = updatedMember.name.trim().split(' ');
    const newInitials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();
      
    setMember({ ...updatedMember, initials: newInitials });
    setIsEditDrawerOpen(false);
    
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#F6F8FC] animate-in fade-in duration-300 pb-24 md:pb-6 relative">
      
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="size-5 text-green-400" />
          <p className="text-sm font-medium">Profile updated successfully!</p>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your personal information.</p>
        </div>
        <button 
          onClick={() => setIsEditDrawerOpen(true)}
          className="flex items-center gap-1.5 bg-white text-blue-600 px-3 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 hover:bg-blue-50 transition-colors"
        >
          <Edit3 className="size-4" />
          <span className="hidden md:inline">Edit Profile</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <MemberProfileDetails member={member} />

      {/* Settings Section */}
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 px-2">Settings & Security</h2>
      
      <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-sm overflow-hidden mb-6">
        
        {/* Biometric Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-[#E5EAF3]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Biometric Login</p>
              <p className="text-xs text-slate-500 mt-0.5">Use Face ID / Fingerprint to open app</p>
            </div>
          </div>
          
          {/* Custom Toggle Switch */}
          <button 
            type="button"
            onClick={() => setIsBiometricEnabled(!isBiometricEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isBiometricEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <span 
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} 
            />
          </button>
        </div>

        {/* WhatsApp Support */}
        <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="p-4 flex items-center justify-between border-b border-[#E5EAF3] hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-[#25D366]/10 text-[#25D366] p-2 rounded-xl">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Chat with Admin</p>
              <p className="text-xs text-slate-500 mt-0.5">Get support via WhatsApp</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-slate-400" />
        </a>

        {/* Logout */}
        <button className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left">
          <div className="bg-red-50 text-red-600 p-2 rounded-xl">
            <LogOut className="size-5" />
          </div>
          <div>
            <p className="font-bold text-red-600 text-sm">Log Out</p>
            <p className="text-xs text-red-400 mt-0.5">Securely sign out of your account</p>
          </div>
        </button>
        
      </div>

      {/* Edit Profile Drawer / Modal */}
      <EditProfileDrawer 
        isOpen={isEditDrawerOpen} 
        onClose={() => setIsEditDrawerOpen(false)} 
        member={member} 
        onSave={handleSaveProfile} 
      />

    </div>
  );
}
