import { Suspense } from "react";
import Script from "next/script";
import PayNowClient from "@/components/public/PayNowClient";

interface PayPageSearchParams {
  source?: string | string[];
}

export default async function PayNowPage({
  searchParams,
}: {
  searchParams: Promise<PayPageSearchParams>;
}) {
  const params = await searchParams;
  const source = Array.isArray(params.source)
    ? params.source[0] ?? null
    : params.source ?? null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Suspense
        fallback={
          <div className="flex min-h-[100svh] items-center justify-center bg-secondary/50 p-4 dark:bg-slate-900">
            <p className="animate-pulse text-sm font-medium text-muted-foreground">Loading payment details...</p>
          </div>
        }
      >
        <PayNowClient source={source} />
      </Suspense>
    </>
  );
}
