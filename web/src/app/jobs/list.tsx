"use client";

import Link from "next/link";

import { useApi } from "@/lib/use-api";
import type { JobListing } from "@/lib/types";
import { Container, Badge, EmptyState } from "@/components/ui/misc";

export function JobsList() {
  const { data, loading } = useApi<JobListing[]>("/jobs");
  const jobs = data ?? [];
  if (loading && !data) return <Container className="py-16 text-center text-muted">Loading…</Container>;

  return (
    <Container className="py-8">
      <h1 className="mb-1 text-3xl font-extrabold">Jobs</h1>
      <p className="mb-6 text-muted">Browse open positions from employers.</p>

      {jobs.length === 0 ? (
        <EmptyState title="No open jobs" icon="💼" />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.slug}`} className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{j.title}</h2>
                  <p className="text-sm text-muted">{j.company_name ?? "Company"} {j.city ? `· ${j.city}` : ""}</p>
                </div>
                <Badge color="brand">{(j.employment_type ?? "").replace("_", " ")}</Badge>
              </div>
              {j.salary_display && <p className="mt-2 text-sm font-semibold text-brand">{j.salary_display}</p>}
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{j.description}</p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
