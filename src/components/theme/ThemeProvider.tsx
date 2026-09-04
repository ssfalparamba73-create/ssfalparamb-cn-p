"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  const isAdmin = pathname.startsWith("/admin");
  const isMember = pathname.startsWith("/member");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/otp-verification");
  
  let storageKey = "theme";
  if (isAdmin) storageKey = "admin-theme";
  if (isMember) storageKey = "member-theme";

  let forcedTheme = undefined;
  if (isAuth) {
    forcedTheme = "light";
  }

  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      storageKey={storageKey}
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
