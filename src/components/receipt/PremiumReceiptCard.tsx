import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Download, 
  Share2, 
  Info, 
  X, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  User, 
  Hash, 
  Tag 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PremiumReceiptCardProps {
  receiptId: string;
  method: string;
  admin: string;
  phone: string;
  amount: string | number;
  category: string;
  customBg?: string;
}

export function PremiumReceiptCard({
  receiptId,
  method,
  admin,
  phone,
  amount,
  category,
  customBg
}: PremiumReceiptCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Core canvas generation function used by both download and share
  const generateCanvas = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const element = receiptRef.current;
    if (!element) throw new Error("Receipt element not found");

    return await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = await generateCanvas();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.download = `SSF_Receipt_${receiptId}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate receipt", error);
      toast.error("Failed to download receipt.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = await generateCanvas();
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          toast.error("Failed to generate image for sharing.");
          return;
        }
        
        const file = new File([blob], `SSF_Receipt_${receiptId}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'SSF Receipt',
            });
          } catch (shareError) {
            console.log("User cancelled share or share failed", shareError);
          }
        } else {
          toast.info("Direct sharing is not supported on this device. Please download instead.");
        }
        setIsSharing(false);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error("Failed to share receipt", error);
      toast.error("Failed to share receipt.");
      setIsSharing(false);
    }
  };

  // Format date to DD/MM/YYYY
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")}/${(
    today.getMonth() + 1
  ).toString().padStart(2, "0")}/${today.getFullYear()}`;
  
  // Format time to HH:MM AM/PM
  const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Use phone as donor name if it's the only identifier
  const donorName = phone === "Guest Member" ? "Valuable Contributor" : phone;

  // Amount formatting
  const formattedAmount = Number(amount).toLocaleString("en-IN");

  return (
    <div className="w-full flex flex-col items-center gap-3 sm:gap-6">
      {/* Receipt Card Wrapper with exact aspect ratio of the SVG (775.5 x 960) */}
      <div
        ref={receiptRef}
        className="relative w-full max-w-[400px] overflow-hidden shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white border border-white/50 transition-shadow duration-500"
        style={{ aspectRatio: "775.5 / 960" }}
      >
        {/* Background SVG */}
        <img 
          src={customBg || "/recept.svg"} 
          alt="SSF Receipt Background" 
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* Overlay Data Container */}
        <div
          className="absolute inset-0 z-10 font-sans"
          style={{ fontFamily: "var(--font-quicksand), sans-serif" }}
        >
          {/* Receipt No */}
          <div className="absolute top-[27%] left-[67.5%] w-[26%] -translate-y-1/2 text-left">
            <div className="text-[#1f1f1f] text-[13px] font-semibold tracking-wide leading-none">
              {receiptId}
            </div>
          </div>

          {/* Date */}
          <div className="absolute top-[30.1%] left-[67.5%] w-[26%] -translate-y-1/2 text-left">
            <div className="text-[#1f1f1f] text-[13px] font-semibold tracking-wide leading-none">
              {dateStr}
            </div>
          </div>

          {/* Donor Name (Center Area) */}
          <div className="absolute top-[44.4%] left-0 w-full -translate-y-1/2 text-center px-12">
            <h2 className="text-[1.55rem] sm:text-[1.75rem] font-bold text-[#1f1f1f] tracking-tight leading-none">
              {donorName}
            </h2>
          </div>

          {/* Amount (Inside the Blue Box Area) */}
          <div className="absolute top-[56.1%] left-[18.8%] w-[62.4%] -translate-y-1/2 text-center">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-wider leading-none drop-shadow-sm">
              Rs. {formattedAmount}/-
            </span>
          </div>
        </div>
      </div>

      {/* 3 Action Buttons Grid */}
      <div className="w-full max-w-[400px] grid grid-cols-3 gap-2.5 sm:gap-3 print:hidden">
        <Button 
          variant="outline"
          className="flex min-w-0 flex-col h-[64px] sm:h-[72px] gap-1.5 bg-white border-[#063b78]/30 hover:bg-[#063b78]/5 hover:border-[#063b78] text-[#063b78] shadow-sm rounded-2xl transition-all"
          onClick={handleDownload}
          disabled={isDownloading || isSharing}
        >
          {isDownloading ? (
            <div className="size-5 border-2 border-[#063b78]/30 border-t-[#063b78] rounded-full animate-spin" />
          ) : (
            <Download className="size-5" />
          )}
          <span className="text-[10px] sm:text-[11px] font-bold leading-none">Download</span>
        </Button>

        <Button 
          variant="outline"
          className="flex min-w-0 flex-col h-[64px] sm:h-[72px] gap-1.5 bg-white border-[#063b78]/30 hover:bg-[#063b78]/5 hover:border-[#063b78] text-[#063b78] shadow-sm rounded-2xl transition-all"
          onClick={handleShare}
          disabled={isDownloading || isSharing}
        >
          {isSharing ? (
            <div className="size-5 border-2 border-[#063b78]/30 border-t-[#063b78] rounded-full animate-spin" />
          ) : (
            <Share2 className="size-5" />
          )}
          <span className="text-[10px] sm:text-[11px] font-bold leading-none">Share</span>
        </Button>

        <Button 
          variant="outline"
          className="flex min-w-0 flex-col h-[64px] sm:h-[72px] gap-1.5 bg-white border-[#063b78]/30 hover:bg-[#063b78]/5 hover:border-[#063b78] text-[#063b78] shadow-sm rounded-2xl transition-all"
          onClick={() => setIsDetailsOpen(true)}
        >
          <Info className="size-5" />
          <span className="text-[10px] sm:text-[11px] font-bold leading-none">Details</span>
        </Button>
      </div>

      {/* Details Modal / Bottom Sheet */}
      {isDetailsOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end items-center p-0 md:justify-center md:p-4 font-sans">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={() => setIsDetailsOpen(false)} />
          
          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] rounded-b-none md:rounded-3xl shadow-2xl pt-8 pb-10 px-6 md:p-6 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Info className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">Payment Details</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-bold">Transaction Successful</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Detail Rows */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 overflow-hidden">
              <div className="flex flex-col divide-y divide-slate-100">
                {/* Transaction ID */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Hash className="size-4" />
                    <span className="text-sm font-medium">Transaction ID</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{receiptId}</span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="size-4" />
                    <span className="text-sm font-medium">Date & Time</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900">{dateStr}</span>
                    <span className="text-xs font-semibold text-slate-400">{timeStr}</span>
                  </div>
                </div>

                {/* Receiver Name */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="size-4" />
                    <span className="text-sm font-medium">Received By</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{admin}</span>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CreditCard className="size-4" />
                    <span className="text-sm font-medium">Method</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 uppercase">{method}</span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tag className="size-4" />
                    <span className="text-sm font-medium">Category</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 capitalize">{category.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-12 rounded-xl transition-colors"
              onClick={() => setIsDetailsOpen(false)}
            >
              Close Details
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
