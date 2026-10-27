"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/auth/auth-shell";
import { Avatar } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setSaving(true);
    try {
      let res = await clientApi<User>("/auth/profile", {
        method: "PUT",
        body: { name, email: email || null, phone: phone || null },
      });
      if (avatar) {
        const fd = new FormData();
        fd.append("avatar", avatar);
        res = await clientApi<User>("/auth/profile", { method: "PUT", formData: fd });
        setAvatar(null);
      }
      setUser(res.data);
      setMsg("Profile updated.");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    const password = window.prompt("Confirm your password to delete:");
    if (!password) return;
    try {
      await clientApi("/auth/account", { method: "DELETE", body: { password } });
      await logout();
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed.");
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-5 text-2xl font-bold">Edit Profile</h1>
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {msg && <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={preview ?? user?.avatar_path} className="h-16 w-16 text-2xl" />
          <label className="cursor-pointer text-sm font-medium text-brand">
            Change photo
            <input
              name="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setAvatar(f);
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
          </label>
        </div>
        <Field label="Full name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Button type="submit" loading={saving}>Save changes</Button>
      </form>

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-700">Danger zone</h2>
        <p className="mt-1 text-sm text-red-600">Permanently delete your account and all data.</p>
        <Button variant="outline" className="mt-3 !border-red-300 !text-red-700" onClick={deleteAccount}>
          Delete account
        </Button>
      </div>
    </div>
  );
}
