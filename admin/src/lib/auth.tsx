"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FbUser } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, ApiError, post } from "./api";
import { auth } from "./firebase";

export interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  avatar_path: string | null;
  roles: string[];
}

interface AuthState {
  user: AdminUser | null;
  permissions: string[];
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (module: string) => boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (fb: FbUser | null) => {
    if (!fb) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      const r = await api<{ user: AdminUser; permissions: string[] }>("/admin/me");
      setUser(r.data.user);
      setPermissions(r.data.permissions);
    } catch {
      await signOut(auth);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (fb) => void loadMe(fb)), [loadMe]);

  const login = useCallback(async (login: string, password: string) => {
    const r = await post<{ auth_email: string; user: AdminUser }>("/auth/login", { login, password });
    const roles = r.data.user.roles ?? [];
    if (!roles.some((x) => ["admin", "super-admin", "staff"].includes(x))) {
      throw new ApiError("This account does not have admin access.", 403);
    }
    await signInWithEmailAndPassword(auth, r.data.auth_email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const can = useCallback((m: string) => permissions.includes(m), [permissions]);

  return <Ctx.Provider value={{ user, permissions, loading, login, logout, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
