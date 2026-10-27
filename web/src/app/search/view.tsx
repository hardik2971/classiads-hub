"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useApi } from "@/lib/use-api";
import type { Ad, Category } from "@/lib/types";
import { Container, EmptyState } from "@/components/ui/misc";
import { AdCardGrid } from "@/components/ad-card";
import { Pagination } from "@/components/pagination";
import { SearchFilters, SortSelect } from "@/components/search-filters";

export function SearchView() {
  const params = useSearchParams();
  const sp: Record<string, string | undefined> = Object.fromEntries(params.entries());
  const query = {
    q: sp.q,
    category_slug: sp.category_slug,
    city_id: sp.city_id,
    price_min: sp.price_min,
    price_max: sp.price_max,
    condition: sp.condition,
    sort: sp.sort,
    page: sp.page,
    per_page: "20",
  };

  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]).toString();
  const { data: categories } = useApi<Category[]>("/categories?roots_only=1");
  const res = useApi<Ad[]>(`/ads?${qs}`);

  const ads = res.data ?? [];
  const pag = res.meta?.pagination;

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<div className="text-sm text-muted">Loading filters…</div>}>
          <SearchFilters categories={categories ?? []} />
        </Suspense>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{sp.q ? `Results for “${sp.q}”` : "All Listings"}</h1>
              <p className="text-sm text-muted">{pag?.total ?? ads.length} listings found</p>
            </div>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {ads.length > 0 ? (
            <>
              <AdCardGrid ads={ads} />
              <Pagination
                current={pag?.current_page ?? 1}
                last={pag?.last_page ?? 1}
                params={query as Record<string, string | undefined>}
                basePath="/search"
              />
            </>
          ) : (
            <EmptyState title="No listings found" subtitle="Try adjusting your filters or search terms." icon="🔍" />
          )}
        </div>
      </div>
    </Container>
  );
}
