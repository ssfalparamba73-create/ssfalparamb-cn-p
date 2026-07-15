"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Search, ArrowLeft, Receipt, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PremiumReceiptCard } from "@/components/receipt/PremiumReceiptCard";
import { adminClient } from "@/lib/frontend-api/adminClient";

export function CashEntryForm() {
  const [category, setCategory] = useState("monthly_dues");
  const [isGuest, setIsGuest] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{name: string, phone: string, id: string} | null>(null);
  
  // Form State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [admin, setAdmin] = useState("Farhan (President)");
  
  // UI State
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceiptId, setGeneratedReceiptId] = useState("");
  const [notes, setNotes] = useState("");
  const [months, setMonths] = useState("");
  const [event, setEvent] = useState("building_fund");

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGuest && !selectedMember) {
      toast.error("Please select a member first");
      return;
    }
    if (isGuest && (!guestName || !guestPhone)) {
      toast.error("Please enter guest name and phone");
      return;
    }
    if (!amount || Number(amount) < 10) {
      toast.error("Please enter a valid amount (Min ₹10)");
      return;
    }
    setShowConfirm(true);
  };

  const confirmAndSave = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, 'admin' state needs to map to actual adminId.
      const res = await adminClient.recordCashEntry({
        memberId: isGuest ? undefined : selectedMember?.id,
        guestName: isGuest ? guestName : undefined,
        guestPhone: isGuest ? guestPhone : undefined,
        category: category as any,
        amount: Number(amount),
        months: category === "monthly_dues" && months ? [months] : undefined,
        eventId: category === "special_event" ? event : undefined,
        receivedByAdminId: "admin_1", // TODO: use actual current admin ID
        notes: notes || undefined
      });
      setGeneratedReceiptId(res.receiptId);
      setShowConfirm(false);
      setShowSuccess(true);
      toast.success("Payment recorded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to record cash entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMember(null);
    setMemberSearch("");
    setGuestName("");
    setGuestPhone("");
    setAmount("");
    setShowSuccess(false);
  };


  const handleSearch = async () => {
    if (memberSearch.length >= 3) {
      try {
        const res = await adminClient.listMembers({ search: memberSearch, pageSize: "5" });
        if (res.items.length > 0) {
          const found = res.items[0];
          setSelectedMember({ name: found.name, phone: found.phone, id: found.id });
          toast.success("Member found");
        } else {
          toast.error("No member found");
        }
      } catch (err: any) {
        toast.error("Error searching members");
      }
    } else {
      toast.error("Please enter at least 3 characters");
    }
  };

  if (showSuccess) {
    const payerName = isGuest ? guestName : selectedMember?.name || "";
    const payerPhone = isGuest ? guestPhone : selectedMember?.phone || "";

    return (
      <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-300 py-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 shadow-sm">
            <Check className="size-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payment Successful!</h2>
          <p className="text-slate-500">The cash entry has been recorded in the ledger.</p>
        </div>

        <div className="w-full max-w-[400px]">
          <PremiumReceiptCard 
            receiptId={generatedReceiptId}
            method="cash"
            admin={admin}
            phone={isGuest ? "Guest Member" : payerPhone}
            amount={amount}
            category={category}
          />
        </div>

        <Button onClick={resetForm} variant="outline" className="mt-4">
          Record Another Payment
        </Button>
      </div>
    );
  }

  if (showConfirm) {
    const payerName = isGuest ? guestName : selectedMember?.name;
    const payerPhone = isGuest ? guestPhone : selectedMember?.phone;

    return (
      <Card className="max-w-md mx-auto border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-slate-100 dark:border-slate-800 pb-4 rounded-t-xl">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertCircle className="size-5 text-blue-600" />
            Confirm Payment
          </CardTitle>
          <CardDescription>
            Please verify the details before saving. This action cannot be easily undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Payer</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{payerName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">₹ {amount}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Category</span>
            <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{category.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-500">Received By</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{admin}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-b-xl border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>
          <Button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmAndSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Confirm & Save"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-xl">Record Payment</CardTitle>
        <CardDescription>
          Enter the details of the cash payment received.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleInitialSubmit}>
        <CardContent className="space-y-6">
          
          {/* Member / Guest Selection */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Payer Details</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="guest-toggle" className="text-xs text-slate-500 cursor-pointer">Guest Entry?</Label>
                <button
                  type="button"
                  id="guest-toggle"
                  role="switch"
                  aria-checked={isGuest}
                  onClick={() => setIsGuest(!isGuest)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isGuest ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isGuest ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {isGuest ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Guest Name <span className="text-red-500">*</span></Label>
                  <Input id="guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Enter name" className="bg-white dark:bg-slate-900" required={isGuest} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input id="guest-phone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="10-digit number" className="bg-white dark:bg-slate-900" required={isGuest} />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                {!selectedMember ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search by name or phone number..." 
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={handleSearch}>Search</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        {selectedMember.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedMember.name}</p>
                        <p className="text-xs text-slate-500">{selectedMember.id} • {selectedMember.phone}</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-500 hover:text-slate-700"
                      onClick={() => setSelectedMember(null)}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Selection */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category">Payment Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_dues">Monthly Dues</SelectItem>
                  <SelectItem value="special_event">Special Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Fields based on Category */}
            {category === "monthly_dues" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tier">Monthly Tier</Label>
                  <Select defaultValue="flexible">
                    <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
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
                  <Label htmlFor="months">Months Covering (e.g. July, Aug)</Label>
                  <Input id="months" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="e.g. July 2026" className="bg-white dark:bg-slate-950" required={!isGuest} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="event">Select Special Event</Label>
                  <Select value={event} onValueChange={setEvent}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building_fund">Building Construction Fund</SelectItem>
                      <SelectItem value="ramadan_relief">Ramadan Relief Fund</SelectItem>
                      <SelectItem value="education_aid">Education Aid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Amount */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="amount">Amount Received (₹) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                <Input 
                  id="amount" 
                  type="number" 
                  min="10" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="pl-8 bg-white dark:bg-slate-950 font-semibold" 
                  required 
                />
              </div>
            </div>

            {/* Received By Admin */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin">Cash Received By (Admin) <span className="text-red-500">*</span></Label>
              <Select value={admin} onValueChange={setAdmin}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Farhan (President)">Farhan (President)</SelectItem>
                  <SelectItem value="Shibili (Secretary)">Shibili (Secretary)</SelectItem>
                  <SelectItem value="Safwan (Treasurer)">Safwan (Treasurer)</SelectItem>
                  <SelectItem value="Fawas (Collector)">Fawas (Collector)</SelectItem>
                  <SelectItem value="Anshid (Collector)">Anshid (Collector)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information..." className="bg-white dark:bg-slate-950" />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900 rounded-b-xl">
          <Button type="button" variant="ghost" className="mr-2" onClick={resetForm}>Clear</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2">
            Proceed
            <ArrowLeft className="size-4 rotate-180" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
