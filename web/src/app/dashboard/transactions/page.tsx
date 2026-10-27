"use client";

import { useApi } from "@/lib/use-api";
import { timeAgo } from "@/lib/utils";
import { Badge, EmptyState, ErrorState } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/button";

interface Txn {
  id: number;
  type: string;
  gateway: string;
  total_display: string;
  status: string;
  paid_at?: string | null;
  created_at?: string;
  invoice?: { number: string } | null;
}

export default function TransactionsPage() {
  const { data, loading, error } = useApi<Txn[]>("/transactions");

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Transactions &amp; Invoices</h1>
      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length === 0 && <EmptyState title="No transactions yet" icon="🧾" />}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {data?.map((t, i) => (
          <div key={t.id} className={`flex items-center justify-between gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}>
            <div>
              <p className="font-medium capitalize">{t.type.replace("_", " ")}</p>
              <p className="text-xs text-muted">
                {t.invoice?.number ?? `#${t.id}`} · {t.gateway} · {timeAgo(t.paid_at ?? t.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{t.total_display}</p>
              <Badge color={t.status === "completed" ? "green" : t.status === "refunded" ? "red" : "accent"}>
                {t.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
