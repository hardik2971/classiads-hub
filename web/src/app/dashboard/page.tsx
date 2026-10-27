"use client";

import Link from "next/link";

import { useAuth } from "@/context/auth-context";
import { useApi } from "@/lib/use-api";
import type { Ad } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";

export default function DashboardOverview() {
  const { user } = useAuth();
  const ads = useApi<Ad[]>("/my/ads");
  const unread = useApi<{ unread_count: number }>("/notifications/unread-count");

  const stats = [
    ["My Ads", ads.meta?.pagination?.total ?? ads.data?.length ?? 0, "/dashboard/ads", "📦"],
    ["Unread Alerts", unread.data?.unread_count ?? 0, "/dashboard/notifications", "🔔"],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-sm text-muted">Manage your listings, messages and account.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([label, value, href, icon]) => (
          <Link key={label} href={href} className="rounded-2xl border border-border bg-card p-5 hover:border-brand/40">
            <div className="text-2xl">{icon}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted">{label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/post-ad" variant="accent">+ Post a new Ad</ButtonLink>
        <ButtonLink href="/dashboard/subscriptions" variant="outline">View Subscription Plans</ButtonLink>
      </div>
    </div>
  );
}
