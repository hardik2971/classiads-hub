"use client";

import Link from "next/link";

import { useApi } from "@/lib/use-api";
import type { Ad, HomePayload } from "@/lib/types";
import { Container, EmptyState } from "@/components/ui/misc";
import { AdCardGrid } from "@/components/ad-card";
import { Hero } from "@/components/home/hero";
import { CategoryRow } from "@/components/home/category-row";
import { AppPromoBanner } from "@/components/home/app-promo";

export default function HomePage() {
  const { data: home, loading } = useApi<HomePayload>("/home");
  const { data: latestAds } = useApi<Ad[]>("/ads?per_page=8&sort=newest");

  const sections = (home?.featured_sections ?? []).filter((s) => s.ads.length > 0);

  return (
    <div className="pb-8">
      <Hero />

      <CategoryRow categories={home?.categories ?? []} />

      <Container className="space-y-12 py-6">
        {sections.map((section) => (
          <SectionBlock key={section.id} title={section.title} viewAllHref="/search">
            <AdCardGrid ads={section.ads.slice(0, 4)} />
          </SectionBlock>
        ))}

        {latestAds && latestAds.length > 0 && (
          <SectionBlock title="All Advertisements">
            <AdCardGrid ads={latestAds} />
            <div className="mt-8 flex justify-center">
              <Link
                href="/search"
                className="inline-flex items-center rounded-full border border-border bg-card px-8 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand hover:text-brand"
              >
                Load More
              </Link>
            </div>
          </SectionBlock>
        )}

        {loading && !home && <AdGridSkeleton />}

        {!loading && !home && (
          <EmptyState title="Unable to load listings" subtitle="Please check your connection and try again." icon="⚠️" />
        )}
      </Container>

      <AppPromoBanner />
    </div>
  );
}

function SectionBlock({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-brand transition-colors hover:text-accent-foreground hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function AdGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}
