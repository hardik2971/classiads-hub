"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { Button, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && next !== "/login" ? next : "/dashboard");
    }
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(form.login.trim(), form.password);
    } catch (err) {
      setError(err instanceof ApiError ? (err.field("login") ?? err.message) : "Sign-in failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary/40" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/20" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="ClassiAds-Hub" className="relative h-16 w-auto self-start" />
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Run your marketplace
            <br />
            from <span className="text-accent">one place.</span>
          </h1>
          <p className="mt-4 max-w-md text-white/75">Moderate ads, manage sellers, packages, payments and content for ClassiAds-Hub — powered by Firebase.</p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} ClassiAds-Hub</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_10px_40px_rgba(39,39,87,0.08)] ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ClassiAds-Hub" className="mb-8 h-14 w-auto" />
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mb-6 mt-1 text-sm text-muted">Sign in to the admin panel.</p>
          <Field label="Email or phone" className="mb-4">
            <Input autoFocus required autoComplete="username" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="admin@example.com" />
          </Field>
          <Field label="Password" className="mb-2">
            <div className="relative">
              <Input required type={show ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-10" />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-3 text-muted hover:text-brand" aria-label="Toggle password">
                <Icon name={show ? "lock" : "eye"} size={18} />
              </button>
            </div>
          </Field>
          {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <Button type="submit" loading={busy} className="mt-6 w-full py-2.5">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
