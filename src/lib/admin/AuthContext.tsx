"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AdminUser } from "./admin-types";
import { MOCK_ADMIN_USERS } from "./mock-data";

interface AuthContextType {
  currentUser: AdminUser | null;
  isLoading: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Hardcoding "Farhan" (admin_1) for now to keep the UI exactly as it was, 
  // but now it's managed centrally here.
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(
    MOCK_ADMIN_USERS.find(u => u.id === "admin_1") || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = async (phone: string, pin: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const user = MOCK_ADMIN_USERS.find(u => u.phone === phone);
      if (user) {
        setCurrentUser(user);
      }
      setIsLoading(false);
    }, 1000);
  };

  const logout = () => {
    setCurrentUser(null);
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
