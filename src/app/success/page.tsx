"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PremiumReceiptCard } from "@/components/receipt/PremiumReceiptCard";
import { requestBackend } from "@/lib/api/backendClient";
import type { PaymentDTO } from "@/lib/backend/dto/payment.dto";
import { useQueryClient } from "@tanstack/react-query";
import { memberQueryKeys } from "@/lib/client/memberQueries";
import Image from 'next/image';

// ─── Skeleton shimmer that mirrors the receipt card's size ──────────────────
function ReceiptSkeleton() {
  return (
    <div className="w-full flex flex-col items-center gap-4 animate-in fade-in duration-300">
      {/* Card skeleton — same max-width as PremiumReceiptCard */}
      <div className="w-full max-w-[400px] aspect-[3/4] rounded-2xl overflow-hidden relative bg-white shadow-lg">
        {/* shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-[shimmer_1.4s_infinite]" />
        {/* top bar */}
        <div className="absolute top-0 left-0 right-0 h-[13%] bg-slate-200/60 rounded-t-2xl" />
        {/* logo area */}
        <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-slate-200/70" />
        {/* name line */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-48 h-6 rounded-lg bg-slate-200/70" />
        {/* blue amount box */}
        <div className="absolute top-[52%] left-[15%] w-[70%] h-[12%] rounded-xl bg-blue-200/40" />
        {/* bottom lines */}
        <div className="absolute bottom-[18%] left-[10%] w-[80%] h-3 rounded-lg bg-slate-200/50" />
        <div className="absolute bottom-[12%] left-[20%] w-[60%] h-3 rounded-lg bg-slate-200/40" />
      </div>

      {/* 3 action button skeletons */}
      <div className="w-full max-w-[400px] grid grid-cols-3 gap-2.5">
        {[0,1,2].map(i => (
          <div key={i} className="h-[64px] rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>

      {/* status pill */}
      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 animate-pulse">
        <span className="size-2 rounded-full bg-blue-400 inline-block animate-ping" />
        Confirming payment&hellip;
      </p>
    </div>
  );
}

// ─── Main page content ───────────────────────────────────────────────────────
function SuccessPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const source = searchParams.get("source");
  const paymentId = searchParams.get("paymentId") || searchParams.get("order_id");
  const [payment, setPayment] = React.useState<PaymentDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!paymentId) { setError("Payment record is missing."); return; }

    const handleSuccess = (p: PaymentDTO) => {
      setPayment(p);
      if (source === "member") {
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.dashboard });
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.payments });
      }
    };

    // Poll for receipt — retries every 1.5 s, gives up after 30 s
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 20 × 1.5s = 30s
    let timerId: ReturnType<typeof setTimeout>;

    const fetchReceipt = () => {
      requestBackend<PaymentDTO>(`/api/v1/payments/${encodeURIComponent(paymentId)}/receipt`)
        .then(handleSuccess)
        .catch(() => {
          attempts++;
          if (attempts < MAX_ATTEMPTS) {
            timerId = setTimeout(fetchReceipt, 1500);
          } else {
            setError("Receipt could not be loaded. Your payment was received. Please check your dashboard.");
          }
        });
    };

    fetchReceipt();
    return () => clearTimeout(timerId);
  }, [paymentId, source, queryClient]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E6F0FA] to-[#F6F8FC] px-3 py-4 sm:px-6 sm:py-10 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-[620px] flex-1 flex flex-col justify-center">

        {/* Branding Header */}
        <div className="relative mb-6 sm:mb-8 flex flex-col items-center justify-center">
          <Link
            href={source === "member" ? "/member/dashboard" : "/"}
            className="absolute left-0 top-0 p-2.5 sm:p-3 text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-full transition-colors print:hidden shadow-sm backdrop-blur-sm border border-slate-200/50"
            title="Go Back"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="flex flex-col items-center justify-center gap-2 mt-4 sm:mt-2 animate-in slide-in-from-top-4 fade-in duration-500">
            <Image
              src="/logo/atiyya-logo-icon.png"
              alt="Atiyya Logo"
              width={64}
              height={64}
              className="object-contain w-16 h-16 md:w-[88px] md:h-[88px] mix-blend-multiply"
              priority
            />
            <h1 className="text-xl md:text-3xl font-cooper text-[#063b78] tracking-tight text-center mt-1">
              Atiyya Group
            </h1>
          </div>
        </div>

        <div className="animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
          ) : payment ? (
            <div className="animate-in fade-in zoom-in-95 duration-400">
              <PremiumReceiptCard
                receiptId={payment.receiptId}
                method={payment.method}
                admin={payment.collectedByAdminName || (payment as any).receivedBy || "Atiyya Group"}
                payerName={payment.payerName}
                phone={payment.payerPhone}
                amount={payment.amount}
                category={payment.category}
                paidAt={payment.paidAt || payment.recordedAt || (payment as any).issuedAt}
              />
            </div>
          ) : (
            // Show skeleton immediately while polling
            <ReceiptSkeleton />
          )}
        </div>

      </div>

      <div className="mt-8 mb-2">
        <p className="text-center text-[11px] sm:text-xs font-semibold text-slate-400">
          This receipt is computer generated by Atiyya Group.
        </p>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F8FC] p-4">
          <div className="size-8 animate-spin rounded-full border-b-2 border-[#2563EB]" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading payment receipt...</p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
