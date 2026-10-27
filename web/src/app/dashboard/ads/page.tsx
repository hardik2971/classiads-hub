"use client";

import Link from "next/link";

import { clientApi } from "@/lib/api.client";
import { useApi } from "@/lib/use-api";
import type { Ad } from "@/lib/types";
import { mediaUrl } from "@/lib/utils";
import { Badge, EmptyState, ErrorState } from "@/components/ui/misc";
import { Button, ButtonLink, Spinner } from "@/components/ui/button";

const STATUS_COLOR: Record<string, "green" | "accent" | "red" | "default"> = {
  approved: "green",
  pending: "accent",
  rejected: "red",
  sold: "default",
  expired: "default",
  draft: "default",
};

export default function MyAdsPage() {
  const { data, loading, error, reload } = useApi<Ad[]>("/my/ads");

  async function act(id: number, path: string, method: "POST" | "DELETE" = "POST") {
    try {
      await clientApi(path, { method });
      reload();
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Ads</h1>
        <ButtonLink href="/post-ad" variant="accent" size="sm">+ Post Ad</ButtonLink>
      </div>

      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length === 0 && <EmptyState title="You have no ads yet" subtitle="Post your first listing." icon="📦" />}

      <div className="space-y-3">
        {data?.map((ad) => {
          const img = mediaUrl(ad.images?.[0]?.url);
          return (
            <div key={ad.id} className="flex gap-4 rounded-2xl border border-border bg-card p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-black/[0.04]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl text-muted">🖼️</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/ad/${ad.slug}`} className="line-clamp-1 font-semibold hover:text-brand">{ad.title}</Link>
                  <Badge color={STATUS_COLOR[ad.status] ?? "default"}>{ad.status}</Badge>
                  {ad.is_featured && <Badge color="accent">★ Featured</Badge>}
                </div>
                <p className="text-sm font-bold text-brand">{ad.price_display}</p>
                <p className="text-xs text-muted">{ad.views_count} views · {ad.favorites_count} favorites</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ButtonLink href={`/dashboard/ads/${ad.id}/edit`} size="sm" variant="outline">Edit</ButtonLink>
                  {ad.status === "approved" && !ad.is_featured && (
                    <ButtonLink
                      href={`/checkout?type=featured&ad_id=${ad.id}&title=${encodeURIComponent(`Feature: ${ad.title}`)}`}
                      size="sm"
                      variant="accent"
                    >
                      ★ Boost
                    </ButtonLink>
                  )}
                  {ad.status !== "sold" && (
                    <Button size="sm" variant="ghost" onClick={() => act(ad.id, `/ads/${ad.id}/sold`)}>Mark sold</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => act(ad.id, `/ads/${ad.id}/renew`)}>Renew</Button>
                  <Button size="sm" variant="ghost" className="!text-red-600" onClick={() => window.confirm("Delete this ad permanently?") && act(ad.id, `/ads/${ad.id}`, "DELETE")}>Delete</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
