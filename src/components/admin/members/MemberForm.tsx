"use client";

import React, { useState, useRef } from "react";
import { Member } from "@/lib/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Camera, Trash2, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { adminClient } from "@/lib/frontend-api/adminClient";
import { MemberInviteDialog } from "@/components/admin/members/MemberInviteDialog";

interface MemberFormProps {
  initialData?: Member;
  isEdit?: boolean;
}

export function MemberForm({ initialData, isEdit }: MemberFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [pin, setPin] = useState(() => (isEdit ? "" : Math.floor(1000 + Math.random() * 9000).toString()));
  const [invite, setInvite] = useState<{ name: string; phone: string; pin: string } | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [familyMembers, setFamilyMembers] = useState<{name: string, relation: string, age: string}[]>([]);

  const validatePhone = (val: string) => {
    // Clean up spaces, dashes, parentheses
    let cleanVal = val.replace(/[\s\-()]/g, '');
    
    // Auto-remove prefixes for Indian numbers
    if (cleanVal.startsWith('+91') && cleanVal.length === 13) {
      cleanVal = cleanVal.substring(3);
    } else if (cleanVal.startsWith('91') && cleanVal.length === 12) {
      cleanVal = cleanVal.substring(2);
    } else if (cleanVal.startsWith('0') && cleanVal.length === 11) {
      cleanVal = cleanVal.substring(1);
    }

    setPhone(cleanVal);
    
    // Validation: Allow 10 digits OR international format (e.g. +971501234567)
    // Between 7 to 15 digits (plus optional '+' at the start)
    const isValidFormat = /^(\+?[0-9]{7,15})$/.test(cleanVal);
    
    if (cleanVal && !isValidFormat) {
      setPhoneError("Please enter a valid phone number (10 digits or international)");
    } else {
      setPhoneError("");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: "", relation: "", age: "" }]);
  };

  const removeFamilyMember = (index: number) => {
    const newMembers = [...familyMembers];
    newMembers.splice(index, 1);
    setFamilyMembers(newMembers);
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const newMembers = [...familyMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFamilyMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phoneError) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone,
      alternatePhone: formData.get("altPhone") as string || undefined,
      age: formData.get("age") ? parseInt(formData.get("age") as string, 10) : undefined,
      address: formData.get("address") as string || undefined,
      area: formData.get("area") as string || undefined,
      occupation: formData.get("occupation") as string || undefined,
      monthlyTier: formData.get("tier") as any,
      monthlyAmount: parseInt(formData.get("amount") as string, 10),
      status: formData.get("status") as any,
      bloodGroup: formData.get("bloodGroup") as any,
      isBloodDonor: formData.get("isDonor") === "on",
      donorAvailable: formData.get("isAvailable") === "on",
      pin: pin || undefined,
    };

    try {
      if (isEdit && initialData) {
        await adminClient.updateMember(initialData.id, data);
        toast.success("Member updated successfully!");
      } else {
        const created = await adminClient.createMember(data);
        toast.success("Member created successfully!");
        setInvite({ name: created.name, phone: created.phone, pin });
        return;
      }
      router.push("/admin/members");
    } catch (err: any) {
      toast.error(err.message || "Failed to save member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300 pb-24">
      
      {/* Photo Upload Section */}
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-28 h-28 rounded-full border-4 border-slate-50 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden group shadow-sm transition-transform hover:scale-105"
        >
          {photoPreview ? (
            <Image src={photoPreview} alt="Profile" fill className="object-cover" />
          ) : (
            <User className="w-12 h-12 text-slate-400" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Upload Profile Photo</p>
        <p className="text-xs text-slate-500 mt-1">JPEG or PNG, Max 5MB</p>
      </div>

      {/* 1. Basic Details */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">1. Basic Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input id="name" name="name" defaultValue={initialData?.name} required placeholder="e.g. Niyas C" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
            <Input 
              id="phone" 
              value={phone}
              onChange={(e) => validatePhone(e.target.value)}
              required 
              placeholder="10-digit mobile number" 
              className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="altPhone">Alternate Phone</Label>
            <Input id="altPhone" name="altPhone" placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" placeholder="e.g. 32" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" placeholder="Full residential address" className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
             <Label htmlFor="area">Area / Branch <span className="text-red-500">*</span></Label>
             <Select name="area" defaultValue={initialData?.area || ""}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alparamba Center">Alparamba Center</SelectItem>
                  <SelectItem value="North Gate">North Gate</SelectItem>
                  <SelectItem value="South Block">South Block</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" name="occupation" placeholder="e.g. Teacher, Business" />
          </div>
        </div>
      </div>

      {/* 2. Membership */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">2. Membership</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Member ID</Label>
            <Input id="memberId" defaultValue={initialData?.memberId} placeholder="Auto-generated if empty" disabled={isEdit} />
          </div>
          <div className="space-y-2">
             <Label htmlFor="status">Status</Label>
             <Select name="status" defaultValue={initialData?.status || "active"}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-2">
             <Label htmlFor="tier">Monthly Tier <span className="text-red-500">*</span></Label>
             <Select name="tier" defaultValue={initialData?.monthlyTier || "flexible"}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible (₹50/₹100)</SelectItem>
                  <SelectItem value="base">Base (₹50)</SelectItem>
                  <SelectItem value="premium">Premium (₹100)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Amount (₹) <span className="text-red-500">*</span></Label>
            <Input id="amount" name="amount" type="number" min="50" defaultValue={initialData?.monthlyAmount || 50} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinedDate">Joined Date</Label>
            <Input id="joinedDate" type="date" />
          </div>
        </div>
      </div>

      {/* 3. Blood Donor */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">3. Blood Donor Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 flex flex-col mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDonor" name="isDonor" defaultChecked={initialData?.isBloodDonor} className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500" />
              <Label htmlFor="isDonor" className="mb-0 font-normal">Register as Blood Donor</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isAvailable" name="isAvailable" defaultChecked={true} className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500" />
              <Label htmlFor="isAvailable" className="mb-0 font-normal">Available to donate now</Label>
            </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="bloodGroup">Blood Group</Label>
             <Select name="bloodGroup" defaultValue={initialData?.bloodGroup || ""}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>

      {/* 4. Family Members */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">4. Family Members</h3>
          <Button type="button" variant="outline" size="sm" onClick={addFamilyMember} className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
            <PlusCircle className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        
        {familyMembers.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No family members added. Click 'Add' to include dependents.</p>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <Input 
                  placeholder="Name" 
                  value={member.name} 
                  onChange={(e) => updateFamilyMember(idx, "name", e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900" 
                />
                <Input 
                  placeholder="Relation (e.g. Son)" 
                  value={member.relation} 
                  onChange={(e) => updateFamilyMember(idx, "relation", e.target.value)}
                  className="w-full sm:w-32 bg-white dark:bg-slate-900" 
                />
                <Input 
                  placeholder="Age" 
                  type="number"
                  value={member.age} 
                  onChange={(e) => updateFamilyMember(idx, "age", e.target.value)}
                  className="w-full sm:w-20 bg-white dark:bg-slate-900" 
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFamilyMember(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-auto">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 5. PIN & Access */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">5. App Access & PIN</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
            <p className="text-sm text-blue-800 dark:text-blue-300">
               By default, members will be prompted to create a 4-digit PIN when they first log in with their phone number via OTP. 
               Only fill this if you want to manually set a PIN for them.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Set 4-Digit PIN (Optional)</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                placeholder="e.g. 1234"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            {isEdit && (
               <div className="space-y-2 flex items-center gap-2 mt-6">
                 <input type="checkbox" id="forceReset" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                 <Label htmlFor="forceReset" className="mb-0 font-normal">Force PIN reset on next login</Label>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Admin Notes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">6. Admin Notes</h3>
        <Textarea placeholder="Any internal notes about this member? (Not visible to the member)" className="min-h-[100px]" />
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 md:left-72 z-10 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
         <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
         <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
           {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
         </Button>
      </div>

      </form>
      <MemberInviteDialog
        isOpen={Boolean(invite)}
        onClose={() => {
          setInvite(null);
          setPin("");
          router.push("/admin/members");
        }}
        memberName={invite?.name || "Member"}
        phone={invite?.phone || ""}
        pin={invite?.pin || ""}
      />
    </>
  );
}
