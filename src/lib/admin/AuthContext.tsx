"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminUser } from "./admin-types";
import { useSession } from "../auth/SessionContext";
import { authClient } from "../frontend-api/authClient";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: AdminUser | null;
  isLoading: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: sessionLoading, refreshSession } = useSession();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session && session.actorType === "admin") {
      setCurrentUser({
        id: session.actorId,
        name: session.name || "Admin",
        role: "viewer",
        phone: "", 
        avatarInitials: (session.name || "Admin")
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        canReceiveCash: false,
        canVerifyPayments: false,
        canManageMembers: false,
        canManageSettings: false,
        status: "active",
      });
    } else {
      setCurrentUser(null);
    }
  }, [session]);

  // Handle automatic redirect if no session on protected admin routes
  useEffect(() => {
    if (!sessionLoading && (!session || session.actorType !== "admin") && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [session, sessionLoading, pathname, router]);

  const login = async (phone: string, pin: string) => {
    setIsLoading(true);
    try {
      await authClient.adminLogin(phone, pin);
      await refreshSession();
      router.push("/admin/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      await refreshSession();
      router.push("/admin/login");
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading: isLoading || sessionLoading, login, logout }}>
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
