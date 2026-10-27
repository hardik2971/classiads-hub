"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function FollowButton({
  sellerId,
  initialFollowing,
}: {
  sellerId: number;
  initialFollowing?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(!!initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/seller/${sellerId}`)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await clientApi<{ following: boolean }>(`/sellers/${sellerId}/follow`, { method: "POST" });
      setFollowing(res.data.following);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={toggle} loading={busy} variant={following ? "outline" : "primary"} size="sm">
      {following ? "Following" : "+ Follow"}
    </Button>
  );
}
