"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { Ad, Category } from "@/lib/types";
import { Container, EmptyState, PageState } from "@/components/ui/misc";
import { AdCardGrid } from "@/components/ad-card";
import { Pagination } from "@/components/pagination";
import { categoryEmoji } from "@/components/category-icon";

export function CategoryView() {
  const slug = useRouteParam(1);
  const page = useSearchParams().get("page") ?? undefined;
  const { data: cat, loading } = useApi<Category>(slug ? `/categories/${slug}` : null);
  const res = useApi<Ad[]>(slug ? `/ads?category_slug=${encodeURIComponent(slug)}&per_page=20&page=${page ?? 1}` : null);

  useEffect(() => {
    if (cat) document.title = `${cat.name} for sale · ClassiAds_Hub`;
  }, [cat]);

  if (!cat) return <PageState loading={loading || slug === null} title="Category not found" />;

  const ads = res.data ?? [];
  const pag = res.meta?.pagination;

  return (
    <Container className="py-8">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link> <span className="mx-1">/</span>
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-3xl">
          {categoryEmoji(cat.slug)}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{cat.name}</h1>
          <p className="text-sm text-muted">{pag?.total ?? cat.ads_count} listings</p>
        </div>
      </div>

      {(cat.children?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {cat.children!.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand/40"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {ads.length > 0 ? (
        <>
          <AdCardGrid ads={ads} />
          <Pagination
            current={pag?.current_page ?? 1}
            last={pag?.last_page ?? 1}
            params={{ page }}
            basePath={`/category/${slug}`}
          />
        </>
      ) : (
        <EmptyState title="No listings yet" subtitle="Be the first to post in this category." icon="📭" />
      )}
    </Container>
  );
}
