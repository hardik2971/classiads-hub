"use client";

import Link from "next/link";

import { useApi } from "@/lib/use-api";
import type { Package } from "@/lib/types";
import { Badge, ErrorState } from "@/components/ui/misc";
import { ButtonLink, Spinner } from "@/components/ui/button";

interface Subscription {
  id: number;
  status: string;
  ends_at?: string | null;
  remaining: number | null;
  is_unlimited: boolean;
  is_live: boolean;
  package?: Package;
}

export default function SubscriptionsPage() {
  const active = useApi<Subscription | null>("/subscriptions/active");
  const packages = useApi<Package[]>("/packages");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Subscription Plans</h1>

      {active.data && (
        <div className="mb-6 rounded-2xl border border-brand/30 bg-brand/[0.04] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{active.data.package?.name}</p>
              <p className="text-sm text-muted">
                {active.data.is_unlimited ? "Unlimited ads" : `${active.data.remaining} ads remaining`} ·
                expires {active.data.ends_at ? new Date(active.data.ends_at).toLocaleDateString() : "—"}
              </p>
            </div>
            <Badge color="green">Active</Badge>
          </div>
        </div>
      )}

      {packages.loading && <Spinner className="h-7 w-7 text-brand" />}
      {packages.error && <ErrorState message={packages.error} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {packages.data?.map((pkg) => {
          const href = `/checkout?type=subscription&package_id=${pkg.id}&title=${encodeURIComponent(pkg.name)}&price=${encodeURIComponent(pkg.price_display)}`;
          return (
            <div key={pkg.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold">{pkg.name}</h3>
              <p className="mt-2 text-3xl font-extrabold text-brand">{pkg.price_display}</p>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>✓ {pkg.is_unlimited ? "Unlimited" : pkg.ad_limit} ad listings</li>
                <li>✓ {pkg.duration_days} days validity</li>
                {pkg.description && <li>✓ {pkg.description}</li>}
              </ul>
              <ButtonLink href={href} className="mt-6" fullWidth>
                Choose Plan
              </ButtonLink>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        Secure checkout with multiple payment methods (sandbox in this demo).
      </p>
    </div>
  );
}
