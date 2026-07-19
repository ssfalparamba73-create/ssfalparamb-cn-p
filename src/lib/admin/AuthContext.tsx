"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSession, loginAdmin, logoutSession } from "@/lib/api/authClient";

interface CurrentAdminUser {
  id: string;
  name: string;
  avatarInitials: string;
  role?: string;
}

interface AuthContextType {
  currentUser: CurrentAdminUser | null;
  isLoading: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then((session) => {
        if (!active || session.actorType !== "admin") return;
        setCurrentUser({
          id: session.actorId,
          name: session.actorName,
          avatarInitials: session.actorName.slice(0, 2).toUpperCase(),
          role: session.actorRole,
        });
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
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
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
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
