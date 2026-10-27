"use client";

import { useState } from "react";

import { useApi } from "@/lib/use-api";
import { timeAgo } from "@/lib/utils";
import type { User } from "@/lib/types";
import { EmptyState, ErrorState } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

interface Review {
  id: number;
  rating: number;
  comment?: string | null;
  type?: string;
  reviewer?: User;
  reviewee?: User;
  created_at?: string;
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<"received" | "given">("received");
  const { data, loading, error } = useApi<Review[]>(
    tab === "received" ? "/reviews/received" : "/reviews/mine",
    [tab],
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reviews</h1>

      <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1">
        {(["received", "given"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-brand text-brand-foreground" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length === 0 && (
        <EmptyState title={tab === "received" ? "No reviews received yet" : "You haven't written any reviews"} icon="🌟" />
      )}

      <div className="space-y-3">
        {data?.map((r) => {
          const who = tab === "received" ? r.reviewer : r.reviewee;
          return (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {tab === "received" ? (who?.name ?? "User") : `To: ${who?.name ?? "User"}`}
                </span>
                <span className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-foreground/80">{r.comment}</p>}
              <p className="mt-1 text-xs text-muted">{timeAgo(r.created_at)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
