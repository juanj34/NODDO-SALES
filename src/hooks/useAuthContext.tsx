"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface AuthContextValue {
  user: { id: string; email: string } | null;
  role: UserRole | null;
  adminUserId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  adminUserId: null,
  loading: true,
  refresh: async () => {},
});

export function useAuthRole(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.role);
        setAdminUserId(data.adminUserId);
      } else {
        setUser(null);
        setRole(null);
        setAdminUserId(null);
      }
    } catch {
      setUser(null);
      setRole(null);
      setAdminUserId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  return (
    <AuthContext value={{ user, role, adminUserId, loading, refresh: fetchAuth }}>
      {children}
    </AuthContext>
  );
}
