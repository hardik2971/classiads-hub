import type { MetadataRoute } from "next";

import { FUNCTION_API, SITE_URL } from "@/lib/config";
import type { Ad, BlogPost, Category, JobListing } from "@/lib/types";

// Frontend sitemap (Next.js metadata route → /sitemap.xml).
// Best-effort: if the API is down,
// it still emits the static routes so the build never fails.
export const dynamic = "force-static";

/** Build-time fetch from the deployed API; returns null when unreachable so the build never fails. */
async function data<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${FUNCTION_API}${path}`);
    const j = await r.json();
    return j.success ? (j.data as T) : null;
  } catch {
    return null;
  }
}

const url = (path: string) => `${SITE_URL}${path}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/search"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: url("/jobs"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: url("/page/about"), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/page/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/page/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/page/contact"), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/login"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/register"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const [categories, ads, posts, jobs] = await Promise.all([
    data<Category[]>("/categories"),
    data<Ad[]>("/ads?per_page=50"),
    data<BlogPost[]>("/blog"),
    data<JobListing[]>("/jobs"),
  ]);

  const flatCats = (categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);
  const categoryRoutes: MetadataRoute.Sitemap = flatCats.map((c) => ({
    url: url(`/category/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const adRoutes: MetadataRoute.Sitemap = (ads ?? []).map((a) => ({
    url: url(`/ad/${a.slug}`),
    lastModified: a.published_at ? new Date(a.published_at) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: url(`/blog/${p.slug}`),
    lastModified: p.published_at ? new Date(p.published_at) : now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map((j) => ({
    url: url(`/jobs/${j.slug}`),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...adRoutes, ...blogRoutes, ...jobRoutes];
}
