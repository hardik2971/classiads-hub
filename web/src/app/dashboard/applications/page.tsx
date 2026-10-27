"use client";

import Link from "next/link";

import { useApi } from "@/lib/use-api";
import { timeAgo } from "@/lib/utils";
import type { JobListing } from "@/lib/types";
import { Badge, EmptyState, ErrorState } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

interface Application {
  id: number;
  status: string;
  created_at?: string;
  job?: JobListing;
}

export default function ApplicationsPage() {
  const { data, loading, error } = useApi<Application[]>("/my/applications");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Job Applications</h1>
      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length === 0 && (
        <EmptyState title="No applications yet" subtitle="Browse jobs and apply." icon="💼" />
      )}
      <div className="space-y-3">
        {data?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              {a.job ? (
                <Link href={`/jobs/${a.job.slug}`} className="font-semibold hover:text-brand">{a.job.title}</Link>
              ) : (
                <span className="font-semibold">Job</span>
              )}
              <p className="text-xs text-muted">
                {a.job?.company_name ?? ""} · applied {timeAgo(a.created_at)}
              </p>
            </div>
            <Badge color={a.status === "hired" ? "green" : a.status === "rejected" ? "red" : "accent"}>
              {a.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
