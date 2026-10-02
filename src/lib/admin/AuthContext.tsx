"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSession, loginAdmin, logoutSession } from "@/lib/api/authClient";
import { BackendApiError } from "@/lib/api/backendClient";
import { SESSION_REFRESH_INTERVAL_MS } from "@/lib/backend/auth/sessionConstants";

interface CurrentAdminUser {
  id: string;
  name: string;
  avatarInitials: string;
  role?: string;
  permissions: string[];
}

interface AuthContextType {
  currentUser: CurrentAdminUser | null;
  isLoading: boolean;
  networkError: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MAX_BROWSER_TIMEOUT_MS = 2_147_000_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    let active = true;
    let lastRefreshAt = 0;
    const refreshSession = async (force = false) => {
      if (!force && Date.now() - lastRefreshAt < SESSION_REFRESH_INTERVAL_MS) return;
      lastRefreshAt = Date.now();
      try {
        const session = await getCurrentSession();
        if (!active) return;
        setNetworkError(false);
        if (session.actorType !== "admin") {
          setCurrentUser(null);
          return;
        }
        setCurrentUser({
          id: session.actorId,
          name: session.actorName,
          avatarInitials: session.actorName.slice(0, 2).toUpperCase(),
          role: session.actorRole,
          permissions: session.permissions ?? [],
        });
      } catch (error) {
        if (!active) return;
        if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
          setCurrentUser(null);
          setNetworkError(false);
        } else {
          setNetworkError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    let refreshTimer = 0;
    const scheduleSessionRefresh = () => {
      const elapsed = Date.now() - lastRefreshAt;
      const remaining = Math.max(SESSION_REFRESH_INTERVAL_MS - elapsed, 0);
      refreshTimer = window.setTimeout(() => {
        if (Date.now() - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS) {
          void refreshSession(true);
        }
        scheduleSessionRefresh();
      }, Math.min(remaining, MAX_BROWSER_TIMEOUT_MS));
    };

    void refreshSession(true);
    scheduleSessionRefresh();
    const onFocus = () => void refreshSession();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const login = async (phone: string, pin: string) => {
    setIsLoading(true);
    try {
      const session = await loginAdmin(phone, pin);
      setCurrentUser({
        id: session.actorId,
        name: session.actorName,
        avatarInitials: session.actorName.slice(0, 2).toUpperCase(),
        role: session.actorRole,
        permissions: session.permissions ?? [],
      });
      setNetworkError(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      setCurrentUser(null);
      setNetworkError(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, networkError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
