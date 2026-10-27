"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useApi } from "@/lib/use-api";
import { useRouteParam } from "@/lib/use-route-param";
import type { JobListing } from "@/lib/types";
import { Container, Badge, PageState } from "@/components/ui/misc";
import { ApplyButton } from "@/components/job/apply-button";

export function JobDetail() {
  const slug = useRouteParam(1);
  const { data: job, loading } = useApi<JobListing>(slug ? `/jobs/${slug}` : null);

  useEffect(() => {
    if (job) document.title = `${job.title} · ClassiAds_Hub`;
  }, [job]);

  if (!job) return <PageState loading={loading || slug === null} title="Job not found" />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    employmentType: (job.employment_type ?? "").toUpperCase(),
    hiringOrganization: { "@type": "Organization", name: job.company_name ?? "Employer" },
    jobLocation: job.city ? { "@type": "Place", address: job.city } : undefined,
  };

  return (
    <Container className="max-w-3xl py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/jobs" className="text-sm text-brand">← All jobs</Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="mt-1 text-muted">{job.company_name ?? "Company"} {job.city ? `· ${job.city}` : ""}</p>
        </div>
        <Badge color="brand">{(job.employment_type ?? "").replace("_", " ")}</Badge>
      </div>
      {job.salary_display && <p className="mt-3 text-lg font-bold text-brand">{job.salary_display}</p>}
      <article className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">{job.description}</article>
      <div className="mt-8">
        <ApplyButton jobId={job.id} slug={job.slug} />
      </div>
    </Container>
  );
}
