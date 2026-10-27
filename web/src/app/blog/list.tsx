"use client";

import Link from "next/link";

import { useApi } from "@/lib/use-api";
import type { BlogPost } from "@/lib/types";
import { mediaUrl, timeAgo } from "@/lib/utils";
import { Container, EmptyState } from "@/components/ui/misc";

export function BlogList() {
  const { data, loading } = useApi<BlogPost[]>("/blog");
  const posts = data ?? [];
  if (loading && !data) return <Container className="py-16 text-center text-muted">Loading…</Container>;

  return (
    <Container className="py-8">
      <h1 className="mb-1 text-3xl font-extrabold">Blog</h1>
      <p className="mb-6 text-muted">Tips, news and updates from the marketplace.</p>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" icon="📝" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const img = mediaUrl(p.cover_image);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
                <div className="aspect-[16/9] bg-black/[0.04]">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-3xl text-muted">📰</div>
                  )}
                </div>
                <div className="p-4">
                  {p.category && <span className="text-xs font-medium text-brand">{p.category.name}</span>}
                  <h2 className="mt-1 line-clamp-2 font-bold">{p.title}</h2>
                  {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                  <p className="mt-2 text-xs text-muted">{timeAgo(p.published_at)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
