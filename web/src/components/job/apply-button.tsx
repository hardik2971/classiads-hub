"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function ApplyButton({ jobId, slug }: { jobId: number; slug: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function apply() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${slug}`)}`);
      return;
    }
    const cover = window.prompt("Add a short cover letter (optional):") ?? "";
    setBusy(true);
    try {
      await clientApi(`/jobs/${jobId}/apply`, { method: "POST", body: { cover_letter: cover } });
      setMsg("Application submitted! Track it in your dashboard.");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not apply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button onClick={apply} loading={busy} size="lg">Apply Now</Button>
      {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
    </div>
  );
}
