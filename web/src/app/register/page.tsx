"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { AuthShell, Field, inputClass } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setTopError(null);
    setLoading(true);
    try {
      const otp = await register({ name, email, phone, password });
      const identifier = email || phone;
      router.push(
        `/verify-otp?identifier=${encodeURIComponent(identifier)}&purpose=register${otp ? `&debug=${otp}` : ""}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setTopError(err.message);
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.errors ?? {})) fe[k] = v[0];
        setErrors(fe);
      } else {
        setTopError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join ClassiAds_Hub to buy and sell">
      <form onSubmit={submit} className="space-y-4">
        {topError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{topError}</div>
        )}
        <Field label="Full name" error={errors.name}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1..."
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </Field>
        <p className="text-xs text-muted">Provide an email or phone — we&apos;ll send a verification code.</p>
        <Button type="submit" fullWidth loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
