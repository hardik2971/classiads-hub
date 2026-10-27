"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { Button } from "@/components/ui/button";
import { AuthShell, Field, inputClass } from "@/components/auth/auth-shell";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get("identifier") ?? "";
  const purpose = params.get("purpose") ?? "register";
  const debug = params.get("debug");

  const [code, setCode] = useState(debug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await clientApi("/auth/otp/verify", {
        method: "POST",
        body: { identifier, purpose, code: code.trim() },
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const channel = identifier.includes("@") ? "email" : "sms";
    try {
      await clientApi("/auth/otp/send", {
        method: "POST",
        body: { identifier, channel, purpose },
      });
      setResent(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthShell title="Verify your account" subtitle={`Enter the code sent to ${identifier || "your contact"}`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {debug && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Dev mode — code: <b>{debug}</b>
          </div>
        )}
        <Field label="Verification code">
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            required
          />
        </Field>
        <Button type="submit" fullWidth loading={loading}>
          Verify
        </Button>
      </form>
      <button onClick={resend} className="mt-4 w-full text-center text-sm font-medium text-brand">
        {resent ? "Code resent" : "Resend code"}
      </button>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
