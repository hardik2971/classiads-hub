"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SITE_URL } from "@/lib/config";
import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { Ad } from "@/lib/types";
import { mediaUrl, timeAgo } from "@/lib/utils";
import { Container, Badge, SectionTitle, PageState } from "@/components/ui/misc";
import { AdCardGrid } from "@/components/ad-card";
import { AdGallery } from "@/components/ad/ad-gallery";
import { AdActions } from "@/components/ad/ad-actions";
import { ReportAd } from "@/components/ad/report-ad";
import { Avatar } from "@/components/ui/avatar";

export function AdDetail() {
  const slug = useRouteParam(1);
  const { data: ad, loading } = useApi<Ad>(slug ? `/ads/${slug}` : null);
  const related = useApi<Ad[]>(slug ? `/ads/${slug}/related` : null).data ?? [];

  useEffect(() => {
    if (ad) document.title = `${ad.title} · ClassiAds_Hub`;
  }, [ad]);

  if (!ad) return <PageState loading={loading || slug === null} title="Listing not found" />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: ad.description,
    image: ad.images?.map((i) => mediaUrl(i.url)).filter(Boolean),
    category: ad.category?.name,
    offers: {
      "@type": "Offer",
      price: ad.price != null ? (ad.price / 100).toFixed(2) : undefined,
      priceCurrency: ad.currency_code,
      availability:
        ad.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${SITE_URL}/ad/${ad.slug}`,
    },
  };

  return (
    <Container className="py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link> <span className="mx-1">/</span>
        {ad.category && (
          <>
            <Link href={`/category/${ad.category.slug}`} className="hover:text-foreground">{ad.category.name}</Link>
            <span className="mx-1">/</span>
          </>
        )}
        <span className="text-foreground">{ad.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: gallery + details */}
        <div className="space-y-6">
          <AdGallery images={ad.images ?? []} title={ad.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {ad.is_featured && <Badge color="accent">★ Featured</Badge>}
              {ad.condition && <Badge>{ad.condition}</Badge>}
              {ad.status === "sold" && <Badge color="red">Sold</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold">{ad.title}</h1>
            <p className="mt-1 text-3xl font-extrabold text-brand">{ad.price_display}</p>
            <p className="mt-1 text-sm text-muted">
              {ad.location?.city ?? ""} {ad.location?.country ? `· ${ad.location.country}` : ""} ·{" "}
              {timeAgo(ad.published_at ?? ad.created_at)} · {ad.views_count} views
            </p>
          </div>

          {(ad.custom_fields?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 font-bold">Specifications</h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                {ad.custom_fields!.map((f) => (
                  <div key={f.code}>
                    <dt className="text-muted">{f.name}</dt>
                    <dd className="font-medium">{String(f.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-bold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{ad.description}</p>
          </div>
        </div>

        {/* Right: actions + seller */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <AdActions adId={ad.id} initialFavorited={ad.is_favorited} />
          </div>

          {ad.seller && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 font-bold">Seller</h2>
              <Link href={`/seller/${ad.seller.id}`} className="flex items-center gap-3">
                <Avatar name={ad.seller.name} src={ad.seller.avatar_path} className="h-12 w-12 text-lg" />
                <div>
                  <p className="flex items-center gap-1 font-semibold">
                    {ad.seller.name}
                    {ad.seller.is_verified && <span title="Verified">✔️</span>}
                  </p>
                  <p className="text-sm text-brand">View profile →</p>
                </div>
              </Link>
            </div>
          )}

          <ReportAd adId={ad.id} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <SectionTitle title="Related Listings" />
          <AdCardGrid ads={related} />
        </div>
      )}
    </Container>
  );
}
