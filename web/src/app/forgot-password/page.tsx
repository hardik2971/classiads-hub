"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { Button } from "@/components/ui/button";
import { AuthShell, Field, inputClass } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loginId, setLoginId] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [debug, setDebug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await clientApi<{ debug_code?: string }>("/auth/password/forgot", {
        method: "POST",
        body: { login: loginId.trim() },
      });
      setDebug(res.data?.debug_code ?? null);
      if (res.data?.debug_code) setCode(res.data.debug_code);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await clientApi("/auth/password/reset", {
        method: "POST",
        body: { login: loginId.trim(), code: code.trim(), password, password_confirmation: password },
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle={step === 1 ? "We'll send a reset code to your email or phone" : "Enter the code and your new password"}
    >
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Field label="Email or phone">
            <input className={inputClass} value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
          </Field>
          <Button type="submit" fullWidth loading={loading}>
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          {debug && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Dev mode — code: <b>{debug}</b>
            </div>
          )}
          <Field label="Reset code">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label="New password">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </Field>
          <Button type="submit" fullWidth loading={loading}>
            Reset password
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-brand">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
