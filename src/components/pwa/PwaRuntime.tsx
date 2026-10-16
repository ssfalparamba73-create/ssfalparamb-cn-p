"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, RefreshCw, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithRelatedApps extends Navigator {
  getInstalledRelatedApps?: () => Promise<Array<{ platform: string; id?: string; url?: string }>>;
}

type InstallMode = "open-app" | "native" | "ios" | "android-help" | "embedded" | null;

const DISMISS_KEY = "atiyya:pwa-install-dismissed-at";
const INSTALLED_KEY = "atiyya:pwa-installed";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60_000;
const VERSION_CHECK_INTERVAL_MS = 30 * 60_000;

function isStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

function detectInstallMode(hasNativePrompt: boolean): InstallMode {
  if (hasNativePrompt) return "native";
  const userAgent = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|WhatsApp|; wv\)|\bwv\b/i.test(userAgent)) return "embedded";
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Android/i.test(userAgent)) return "android-help";
  return null;
}

function wasRecentlyDismissed(): boolean {
  try {
    const value = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - value < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function hasInstalledMarker(): boolean {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaRuntime({ currentVersion }: { currentVersion: string }) {
  const pathname = usePathname();
  const installEvent = useRef<BeforeInstallPromptEvent | null>(null);
  const lastVersionCheck = useRef(0);
  const [installMode, setInstallMode] = useState<InstallMode>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const isInstallSurface = pathname === "/" || pathname === "/login";

  const refreshInstallState = useCallback((hasNativePrompt = Boolean(installEvent.current)) => {
    if (isStandalone()) {
      setShowInstall(false);
      return;
    }
    const mode = hasInstalledMarker() ? "open-app" : detectInstallMode(hasNativePrompt);
    setInstallMode(mode);
    setShowInstall(Boolean(mode) && (mode === "open-app" || !wasRecentlyDismissed()));
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as BeforeInstallPromptEvent;
      refreshInstallState(true);
    };
    const onInstalled = () => {
      installEvent.current = null;
      try {
        window.localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        // Installed-state persistence is optional.
      }
      setInstallMode("open-app");
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => refreshInstallState(), 1_200);
    const relatedAppsNavigator = navigator as NavigatorWithRelatedApps;
    if (relatedAppsNavigator.getInstalledRelatedApps) {
      void relatedAppsNavigator.getInstalledRelatedApps()
        .then((apps) => {
          if (!apps.some((app) => app.platform === "webapp")) return;
          try {
            window.localStorage.setItem(INSTALLED_KEY, "1");
          } catch {
            // Installed-state persistence is optional.
          }
          setInstallMode("open-app");
          setShowInstall(true);
        })
        .catch(() => undefined);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [refreshInstallState]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const register = () => void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    if (now - lastVersionCheck.current < VERSION_CHECK_INTERVAL_MS) return;
    lastVersionCheck.current = now;
    try {
      const response = await fetch("/api/version", { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const payload = (await response.json()) as { version?: string };
      if (payload.version && payload.version !== currentVersion) setUpdateAvailable(true);
    } catch {
      // Optional check: it must never delay or break the application.
    }
  }, [currentVersion]);

  useEffect(() => {
    if (!isStandalone()) return;
    const idle = window.setTimeout(() => void checkVersion(), 5_000);
    const onFocus = () => void checkVersion();
    const onOnline = () => void checkVersion();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [checkVersion]);

  const dismissInstall = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Dismiss persistence is optional.
    }
    setShowInstall(false);
  };

  const install = async () => {
    const event = installEvent.current;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    installEvent.current = null;
    setShowInstall(false);
  };

  const openInstalledApp = () => {
    if (/Android/i.test(navigator.userAgent)) {
      const fallbackUrl = encodeURIComponent(
        `${window.location.origin}/member/dashboard?source=open-app-fallback`
      );
      window.location.href = `intent://open#Intent;scheme=web+atiyya;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallbackUrl};end`;
      return;
    }
    window.location.href = "web+atiyya://open";
  };

  const updateNow = async () => {
    if (updating) return;
    setUpdating(true);
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined);
      await registration?.update().catch(() => undefined);
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  return (
    <>
      {isInstallSurface && showInstall && installMode && (
        <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-md rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl sm:bottom-6 dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-label="Install Atiyya app">
          <button type="button" onClick={dismissInstall} aria-label="Close install message" className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button>
          <div className="pr-10">
            <p className="font-bold text-slate-900 dark:text-slate-50">
              {installMode === "open-app" ? "Open Atiyya" : "Install Atiyya"}
            </p>
            {installMode === "open-app" && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Atiyya is already installed on this device.</p>}
            {installMode === "native" && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add the portal to your phone for quick, app-like access.</p>}
            {installMode === "ios" && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Safari-ൽ <Share2 className="mx-1 inline size-4" /> Share അമർത്തി <strong>Add to Home Screen</strong> തിരഞ്ഞെടുക്കുക.</p>}
            {installMode === "android-help" && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Browser menu തുറന്ന് <strong>Install app</strong> അല്ലെങ്കിൽ <strong>Add to Home screen</strong> തിരഞ്ഞെടുക്കുക.</p>}
            {installMode === "embedded" && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">ഈ page Chrome അല്ലെങ്കിൽ Safari-ൽ തുറന്ന് app install ചെയ്യുക.</p>}
          </div>
          {installMode === "open-app" && <button type="button" onClick={openInstalledApp} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 font-semibold text-white hover:bg-green-700">Open App</button>}
          {installMode === "native" && <button type="button" onClick={() => void install()} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700"><Download className="size-4" /> Install App</button>}
        </aside>
      )}
      {updateAvailable && (
        <aside className="fixed inset-x-3 bottom-3 z-[110] mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="status">
          <p className="font-bold text-slate-900 dark:text-slate-50">New version available</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Update now to use the latest version of Atiyya.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setUpdateAvailable(false)} className="h-11 flex-1 rounded-xl border border-slate-200 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Later</button>
            <button type="button" onClick={() => void updateNow()} disabled={updating} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-60"><RefreshCw className={`size-4 ${updating ? "animate-spin" : ""}`} /> Update now</button>
          </div>
        </aside>
      )}
    </>
  );
}
