"use client";

import { clientApi } from "@/lib/api.client";
import { useApi } from "@/lib/use-api";
import { timeAgo } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/ui/misc";
import { Button, Spinner } from "@/components/ui/button";

interface Notif {
  id: string;
  title?: string | null;
  body?: string | null;
  read: boolean;
  created_at?: string;
}

export default function NotificationsPage() {
  const { data, loading, error, reload } = useApi<Notif[]>("/notifications");

  async function markAll() {
    await clientApi("/notifications/read-all", { method: "POST" });
    reload();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button size="sm" variant="outline" onClick={markAll}>Mark all read</Button>
      </div>
      {loading && <Spinner className="h-7 w-7 text-brand" />}
      {error && <ErrorState message={error} />}
      {data && data.length === 0 && <EmptyState title="No notifications yet" icon="🔔" />}
      <div className="space-y-2">
        {data?.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 ${n.read ? "border-border bg-card" : "border-brand/30 bg-brand/[0.04]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title ?? "Notification"}</p>
                {n.body && <p className="text-sm text-foreground/80">{n.body}</p>}
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </div>
            <p className="mt-1 text-xs text-muted">{timeAgo(n.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
