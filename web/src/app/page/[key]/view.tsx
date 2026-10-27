"use client";

import { useEffect } from "react";

import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { CmsPage } from "@/lib/types";
import { Container, PageState } from "@/components/ui/misc";

export function CmsPageView() {
  const key = useRouteParam(1);
  const { data: page, loading } = useApi<CmsPage>(key ? `/pages/${key}` : null);

  useEffect(() => {
    if (page) document.title = `${page.title} · ClassiAds_Hub`;
  }, [page]);

  if (!page) return <PageState loading={loading || key === null} title="Page not found" />;

  const body = page.body ?? "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(body);

  return (
    <Container className="max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{page.title}</h1>
      {looksLikeHtml ? (
        <article
          className="
            mt-6 text-foreground/90 leading-relaxed
            [&_.lead]:text-base [&_.lead]:text-muted [&_.lead]:mt-2
            [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand sm:[&_h2]:text-2xl
            [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:font-semibold [&_h3]:text-foreground
            [&_p]:mt-3
            [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5
            [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent-foreground
            [&_strong]:font-semibold [&_strong]:text-foreground
            [&_em]:italic
          "
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : (
        <article className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">{body}</article>
      )}
    </Container>
  );
}
