"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode | undefined;
  resolvedTheme: ThemeMode | undefined;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: undefined,
  resolvedTheme: undefined,
  setTheme: () => undefined,
});

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event("ssf-theme-change"));
}

function getThemeSnapshot(): ThemeMode | undefined {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerThemeSnapshot(): undefined {
  return undefined;
}

function getStorageKey(pathname: string): string {
  if (pathname.startsWith("/admin")) return "admin-theme";
  if (pathname.startsWith("/member")) return "member-theme";
  return "theme";
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const storageKey = useMemo(() => getStorageKey(pathname), [pathname]);
  const forcedTheme: ThemeMode | undefined = pathname.startsWith("/login") || pathname.startsWith("/otp-verification")
    ? "light"
    : undefined;

  const subscribe = useCallback((notify: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      let storedTheme: string | null = null;
      try {
        storedTheme = window.localStorage.getItem(storageKey);
      } catch {
        // Keep the light fallback when storage is unavailable.
      }
      applyTheme(forcedTheme ?? (storedTheme === "dark" ? "dark" : "light"));
      notify();
    };
    window.addEventListener("ssf-theme-change", notify);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("ssf-theme-change", notify);
      window.removeEventListener("storage", handleStorage);
    };
  }, [forcedTheme, storageKey]);
  const resolvedTheme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(storageKey);
    } catch {
      // Keep the light fallback when storage is unavailable.
    }
    const nextTheme: ThemeMode = forcedTheme ?? (storedTheme === "dark" ? "dark" : "light");
    applyTheme(nextTheme);
  }, [forcedTheme, storageKey]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    if (forcedTheme) return;
    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Theme changes still apply for the current session.
    }
    applyTheme(nextTheme);
  }, [forcedTheme, storageKey]);

  const value: ThemeContextValue = {
    theme: forcedTheme ?? resolvedTheme,
    resolvedTheme: forcedTheme ?? resolvedTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
