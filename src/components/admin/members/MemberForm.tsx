"use client";

import React, { useState } from "react";
import type { Member, MemberStatus } from "@/lib/admin/admin-types";
import type { CreateMemberInput, UpdateMemberInput } from "@/lib/backend/contracts/member.contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Trash2, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { BackendApiError } from "@/lib/api/backendClient";
import { createAdminMember, issueAdminMemberPin, softDeleteAdminMember, updateAdminMember } from "@/lib/api/memberClient";
import { MemberInvitationDialog } from "./MemberInvitationDialog";
import type { IssuedMemberPinDTO } from "@/lib/backend/dto/member.dto";

interface MemberFormProps {
  initialData?: Member;
  isEdit?: boolean;
}

export function MemberForm({ initialData, isEdit }: MemberFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [area, setArea] = useState(initialData?.area || "");
  const [status, setStatus] = useState<MemberStatus>(initialData?.status || "active");
  const [monthlyTier, setMonthlyTier] = useState<Member["monthlyTier"]>(initialData?.monthlyTier || "flexible");
  const [bloodGroup, setBloodGroup] = useState<Member["bloodGroup"] | "">(initialData?.bloodGroup || "");
  const [isBloodDonor, setIsBloodDonor] = useState(Boolean(initialData?.isBloodDonor));
  const [donorAvailable, setDonorAvailable] = useState(Boolean(initialData?.donorAvailable));
  const [invitation, setInvitation] = useState<IssuedMemberPinDTO | null>(null);
  const [familyMembers, setFamilyMembers] = useState<{name: string, relation: string, age: string}[]>(
    initialData?.familyMembers?.map((member) => ({
      name: member.name,
      relation: member.relationship,
      age: member.age?.toString() ?? "",
    })) ?? []
  );

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

  const addFamilyMember = () => {
    if (familyMembers.length >= 25) {
      toast.error("A maximum of 25 family members is allowed.");
      return;
    }
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
    const formData = new FormData(e.currentTarget);
    const numberValue = (name: string) => {
      const value = String(formData.get(name) ?? "").trim();
      return value ? Number(value) : undefined;
    };
    const textValue = (name: string) => String(formData.get(name) ?? "").trim() || undefined;

    if (isEdit && initialData && status === "left") {
      if (!window.confirm("Move this member to left status? Their current login session will end.")) return;
      try {
        setIsSubmitting(true);
        await softDeleteAdminMember(initialData.id);
        toast.success("Member moved to left status.");
        router.push("/admin/members");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update member.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const input: CreateMemberInput = {
      name: String(formData.get("name") ?? ""),
      phone,
      alternatePhone: textValue("alternatePhone"),
      age: numberValue("age"),
      address: textValue("address"),
      area: area || undefined,
      occupation: textValue("occupation"),
      status: status as Exclude<MemberStatus, "left">,
      monthlyTier,
      monthlyAmount: numberValue("monthlyAmount") ?? 50,
      joinedAt: textValue("joinedAt"),
      bloodGroup: bloodGroup || undefined,
      isBloodDonor,
      donorAvailable: isBloodDonor && donorAvailable,
      familyMembers: familyMembers.map((member) => ({
        name: member.name,
        relationship: member.relation,
        age: member.age ? Number(member.age) : undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        const saved = await updateAdminMember(initialData.id, input as UpdateMemberInput);
        toast.success("Member updated successfully!");
        router.push(`/admin/members/${saved.id}`);
        router.refresh();
        return;
      }

      const saved = await createAdminMember(input);
      toast.success("Member created successfully!");

      if (saved.status !== "active") {
        toast.info("Activate the member before generating a login invitation.");
        router.push(`/admin/members/${saved.id}`);
        router.refresh();
        return;
      }

      try {
        setInvitation(await issueAdminMemberPin(saved.id));
      } catch (pinError) {
        toast.error(
          pinError instanceof Error
            ? `Member created, but invitation PIN failed: ${pinError.message}`
            : "Member created, but the invitation PIN could not be generated."
        );
        router.push(`/admin/members/${saved.id}`);
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof BackendApiError || error instanceof Error
        ? error.message
        : "Unable to save member.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300 pb-24">

      {/* Photo Upload Section */}
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div
          aria-disabled="true"
          title="Profile photo upload is not enabled yet"
          className="relative w-28 h-28 rounded-full border-4 border-slate-50 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-not-allowed overflow-hidden shadow-sm opacity-75"
        >
          <User className="w-12 h-12 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Upload Profile Photo</p>
        <p className="text-xs text-slate-500 mt-1">Photo upload will be available later</p>
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
              name="phone"
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
            <Input id="altPhone" name="alternatePhone" defaultValue={initialData?.alternatePhone} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" min="0" max="130" defaultValue={initialData?.age} placeholder="e.g. 32" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={initialData?.address} placeholder="Full residential address" className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
             <Label htmlFor="area">Area / Branch <span className="text-red-500">*</span></Label>
             <Select value={area} onValueChange={setArea}>
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
            <Input id="occupation" name="occupation" defaultValue={initialData?.occupation} placeholder="e.g. Teacher, Business" />
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
             <Select value={status} onValueChange={(value) => setStatus(value as MemberStatus)}>
                <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  {isEdit && <SelectItem value="left">Left (soft delete)</SelectItem>}
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-2">
             <Label htmlFor="tier">Monthly Tier <span className="text-red-500">*</span></Label>
             <Select value={monthlyTier} onValueChange={(value) => setMonthlyTier(value as Member["monthlyTier"])}>
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
            <Input id="amount" name="monthlyAmount" type="number" min="1" defaultValue={initialData?.monthlyAmount || 50} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinedDate">Joined Date</Label>
            <Input id="joinedDate" name="joinedAt" type="date" defaultValue={initialData?.joinedAt?.slice(0, 10)} />
          </div>
        </div>
      </div>

      {/* 3. Blood Donor */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">3. Blood Donor Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 flex flex-col mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDonor" checked={isBloodDonor} onChange={(event) => setIsBloodDonor(event.target.checked)} className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500" />
              <Label htmlFor="isDonor" className="mb-0 font-normal">Register as Blood Donor</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isAvailable" checked={donorAvailable} disabled={!isBloodDonor} onChange={(event) => setDonorAvailable(event.target.checked)} className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500" />
              <Label htmlFor="isAvailable" className="mb-0 font-normal">Available to donate now</Label>
            </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="bloodGroup">Blood Group</Label>
             <Select value={bloodGroup} onValueChange={(value) => setBloodGroup(value as Member["bloodGroup"])}>
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
          <p className="text-sm text-slate-500 italic">No family members added. Click &apos;Add&apos; to include dependents.</p>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <Input
                  placeholder="Name"
                  required
                  value={member.name}
                  onChange={(e) => updateFamilyMember(idx, "name", e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900"
                />
                <Input
                  placeholder="Relation (e.g. Son)"
                  required
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
               Save the member first. Then use Reset PIN on the member details page to generate a secure 4-digit login code. The code is shown only once.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Admin Notes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">6. Admin Notes</h3>
        <Textarea disabled placeholder="Admin notes will be available in a later phase." className="min-h-[100px]" />
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 md:left-72 z-10 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
         <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
         <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
           {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
         </Button>
      </div>

      {invitation && (
        <MemberInvitationDialog
          memberName={invitation.memberName}
          phone={invitation.phone}
          pin={invitation.pin}
          message={invitation.message}
          onClose={() => {
            const memberId = invitation.memberId;
            setInvitation(null);
            router.push(`/admin/members/${memberId}`);
            router.refresh();
          }}
        />
      )}

    </form>
  );
}
