"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, IconBtn, PageHeader, Select, StatusBadge, UserCell, useUi } from "@/components/ui";
import { post } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

export default function UserSubscriptions() {
  const { toast, confirm } = useUi();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [status, per]);
  const list = useFetch<any[]>("/admin/subscriptions", { status, page, per_page: per });

  return (
    <div>
      <PageHeader title="User Subscriptions" />
      <Card>
        <label className="mb-4 block max-w-xs">
          <span className="label">Status</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["active", "pending", "expired", "cancelled"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} placeholder="All" />
        </label>
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          pagination={list.meta?.pagination}
          onPage={setPage}
          perPage={per}
          onPerPage={setPer}
          onRefresh={() => void list.reload()}
          exportName="user-subscriptions"
          columns={[
            { key: "user", label: "User Name", render: (r) => <UserCell user={r.user} />, value: (r) => r.user?.name },
            { key: "package", label: "Package Name", align: "center", render: (r) => r.package?.name ?? "-", value: (r) => r.package?.name },
            { key: "starts_at", label: "Start Date", align: "center", render: (r) => fmtDate(r.starts_at), sortable: true },
            { key: "ends_at", label: "End Date", align: "center", render: (r) => (r.ends_at ? fmtDate(r.ends_at) : "Unlimited"), sortable: true },
            { key: "status", label: "Status", align: "center", render: (r) => <StatusBadge status={r.status} /> },
            { key: "ad_limit", label: "Total Limit", align: "center", render: (r) => (r.is_unlimited ? "Unlimited" : (r.ad_limit ?? "-")) },
            { key: "ads_used", label: "Used Limit", align: "center", sortable: true },
            {
              key: "actions",
              label: "Action",
              render: (r) =>
                r.status === "active" ? (
                  <IconBtn
                    icon="x"
                    title="Cancel subscription"
                    tone="danger"
                    onClick={async () => {
                      if (await confirm({ message: `Cancel ${r.user?.name}'s ${r.package?.name ?? ""} subscription?`, confirmLabel: "Cancel subscription" })) {
                        await post(`/admin/subscriptions/${r.id}/cancel`);
                        toast("Subscription cancelled.");
                        await list.reload();
                      }
                    }}
                  />
                ) : (
                  "-"
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
