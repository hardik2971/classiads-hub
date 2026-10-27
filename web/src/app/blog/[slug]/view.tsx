"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { BlogPost } from "@/lib/types";
import { mediaUrl, timeAgo } from "@/lib/utils";
import { Container, PageState } from "@/components/ui/misc";

export function BlogDetail() {
  const slug = useRouteParam(1);
  const { data: post, loading } = useApi<BlogPost>(slug ? `/blog/${slug}` : null);

  useEffect(() => {
    if (post) document.title = `${post.title} · ClassiAds_Hub`;
  }, [post]);

  if (!post) return <PageState loading={loading || slug === null} title="Article not found" />;

  const img = mediaUrl(post.cover_image);

  return (
    <Container className="max-w-3xl py-8">
      <Link href="/blog" className="text-sm text-brand">← Back to blog</Link>
      <h1 className="mt-3 text-3xl font-extrabold">{post.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {post.author?.name ? `By ${post.author.name} · ` : ""}{timeAgo(post.published_at)}
      </p>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={post.title} className="mt-5 w-full rounded-2xl object-cover" />
      )}
      {/<\/?[a-z][\s\S]*>/i.test(post.body ?? "") ? (
        <article
          className="mt-6 leading-relaxed text-foreground/90 [&_a]:text-brand [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: post.body ?? "" }}
        />
      ) : (
        <article className="prose mt-6 max-w-none whitespace-pre-line text-foreground/90">{post.body}</article>
      )}
    </Container>
  );
}
