import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/backend/auth/sessionConstants";
import { MEMBER_PAYMENTS_ENABLED } from "@/lib/featureFlags";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!MEMBER_PAYMENTS_ENABLED) {
    const isMemberHistory = pathname.startsWith("/member/payments");
    const isMemberCheckout = pathname === "/pay" && request.nextUrl.searchParams.get("source") === "member";
    if (isMemberHistory || isMemberCheckout) {
      return NextResponse.redirect(new URL("/member/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/member") && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*", "/pay"],
};
