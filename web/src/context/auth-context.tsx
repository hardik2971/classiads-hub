"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { auth } from "@/lib/firebase";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (input: RegisterInput) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

export interface RegisterInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sessions are Firebase Auth sessions. The API validates credentials / provisions the
 * profile and returns the e-mail to sign in with (phone accounts use a synthetic one).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await clientApi<User>("/auth/me");
        setUser(res.data);
        break;
      } catch (e) {
        // Only a definitive rejection ends the session. A network error / aborted request (e.g. the
        // page unloading mid-request right after login) or a 5xx must not sign the user out.
        const status = e instanceof ApiError ? e.status : 0;
        if (status === 401 || status === 403) {
          await signOut(auth);
          setUser(null);
          break;
        }
        if (attempt >= 2) {
          setUser(null);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => onAuthStateChanged(auth, () => void refresh()), [refresh]);

  const login = useCallback(async (loginId: string, password: string) => {
    const res = await clientApi<{ user: User; auth_email: string }>("/auth/login", {
      method: "POST",
      body: { login: loginId, password },
    });
    await signInWithEmailAndPassword(auth, res.data.auth_email, password);
    setUser(res.data.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    const me = await clientApi<User>("/auth/me");
    setUser(me.data);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await clientApi<{ user: User; auth_email: string; otp?: { debug_code?: string } }>("/auth/register", {
      method: "POST",
      body: {
        name: input.name,
        email: input.email || undefined,
        phone: input.phone || undefined,
        password: input.password,
        password_confirmation: input.password,
      },
    });
    await signInWithEmailAndPassword(auth, res.data.auth_email, input.password);
    setUser(res.data.user);
    return res.data.otp?.debug_code ?? null;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, loginWithGoogle, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
