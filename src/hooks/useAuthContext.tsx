"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  adminUserId: string | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  adminUserId: null,
  isPlatformAdmin: false,
  loading: true,
  refresh: async () => {},
});

export function useAuthRole(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.role);
        setAdminUserId(data.adminUserId);
        setIsPlatformAdmin(data.isPlatformAdmin ?? false);
      } else {
        setUser(null);
        setRole(null);
        setAdminUserId(null);
        setIsPlatformAdmin(false);
      }
    } catch {
      setUser(null);
      setRole(null);
      setAdminUserId(null);
      setIsPlatformAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  return (
    <AuthContext value={{ user, role, adminUserId, isPlatformAdmin, loading, refresh: fetchAuth }}>
      {children}
    </AuthContext>
  );
}
