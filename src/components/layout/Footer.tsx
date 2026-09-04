import Link from "next/link";
import { TransparentLogo } from "@/components/TransparentLogo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8 text-sm text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <TransparentLogo src="/logo/atiyya-logo-icon.png" alt="Atiyya Logo" className="h-6 w-auto object-contain" />
            <span className="font-extrabold tracking-tight text-base pt-0.5">Atiyya</span>
          </div>
          <nav aria-label="Footer Navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/shipping-policy" className="hover:text-blue-600 transition-colors">
              Shipping Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-blue-600 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/cancellation-and-refund-policy" className="hover:text-blue-600 transition-colors">
              Cancellation & Refund Policy
            </Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>
        <div className="mt-4 text-center text-xs text-slate-400 md:text-left">
          &copy; {new Date().getFullYear()} Atiyya. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
