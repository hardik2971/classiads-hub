"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function AdActions({
  adId,
  initialFavorited,
}: {
  adId: number;
  initialFavorited?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [favorited, setFavorited] = useState(!!initialFavorited);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function requireAuth(): boolean {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    return true;
  }

  async function toggleFavorite() {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const res = await clientApi<{ favorited: boolean }>(`/ads/${adId}/favorite`, { method: "POST" });
      setFavorited(res.data.favorited);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function startChat() {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const res = await clientApi<{ id: number }>("/conversations", { method: "POST", body: { ad_id: adId } });
      router.push(`/dashboard/chat?c=${res.data.id}`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not start chat.");
    } finally {
      setBusy(false);
    }
  }

  async function makeOffer() {
    if (!requireAuth()) return;
    const amount = window.prompt("Enter your offer amount:");
    if (!amount) return;
    if (!(Number(amount) > 0)) {
      setMsg("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      await clientApi("/offers", { method: "POST", body: { ad_id: adId, amount: Number(amount) } });
      setMsg("Offer sent!");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not send offer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button onClick={startChat} loading={busy} fullWidth>
          💬 Chat
        </Button>
        <Button onClick={makeOffer} variant="accent" fullWidth>
          💰 Make an Offer
        </Button>
      </div>
      <Button onClick={toggleFavorite} variant="outline" fullWidth disabled={busy}>
        {favorited ? "♥ Saved" : "♡ Save to favorites"}
      </Button>
      {msg && <p className="text-center text-sm text-muted">{msg}</p>}
    </div>
  );
}
