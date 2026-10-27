"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { AuthShell, Field, inputClass } from "@/components/auth/auth-shell";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginId.trim(), password);
      router.push(params.get("next") || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your ClassiAds_Hub account">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field label="Email or phone">
          <input
            className={inputClass}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          Continue
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
