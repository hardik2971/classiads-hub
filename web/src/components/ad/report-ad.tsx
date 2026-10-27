"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/auth/auth-shell";

interface ReportReason {
  id: number;
  reason: string;
}

/** "Report this ad" link that expands into an inline reason form (POST /reports). */
export function ReportAd({ adId }: { adId: number }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen((v) => !v);
    if (!reasons.length) {
      clientApi<ReportReason[]>("/report-reasons")
        .then((r) => setReasons(r.data ?? []))
        .catch(() => {});
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await clientApi("/reports", { method: "POST", body: { type: "ad", id: adId, reason, details: details || null } });
      setMsg(res.message || "Report submitted. Thank you.");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit report.");
    } finally {
      setBusy(false);
    }
  }

  if (msg) return <p className="text-center text-sm text-green-700">{msg}</p>;

  return (
    <div>
      <button type="button" onClick={toggle} className="block w-full text-center text-sm text-muted hover:text-red-600">
        ⚑ Report this ad
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <select name="reason" className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} required>
            <option value="">Select a reason</option>
            {reasons.map((r) => <option key={r.id} value={r.reason}>{r.reason}</option>)}
            <option value="Other">Other</option>
          </select>
          <textarea
            name="details"
            className={`${inputClass} h-20 py-2`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details (optional)"
          />
          <Button type="submit" size="sm" fullWidth loading={busy}>Submit report</Button>
        </form>
      )}
    </div>
  );
}
