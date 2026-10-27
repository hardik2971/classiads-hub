"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, IconBtn, PageHeader, Select, StatusBadge, Thumb, Toggle, UserCell, useUi } from "@/components/ui";
import { post } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

export default function UserReports() {
  const { toast } = useUi();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [status, type, per]);
  const list = useFetch<any[]>("/admin/reports", { status, type, page, per_page: per });

  return (
    <div>
      <PageHeader title="User Reports" />
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label>
            <span className="label">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["open", "reviewing", "resolved", "dismissed"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} placeholder="All" />
          </label>
          <label>
            <span className="label">Item</span>
            <Select value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "ad", label: "Advertisements" }, { value: "user", label: "Users" }]} placeholder="All" />
          </label>
        </div>
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          pagination={list.meta?.pagination}
          onPage={setPage}
          perPage={per}
          onPerPage={setPer}
          onRefresh={() => void list.reload()}
          exportName="user-reports"
          columns={[
            { key: "reason", label: "Reason", align: "center", sortable: true },
            { key: "reporter", label: "User", align: "center", render: (r) => <span className="flex justify-center"><UserCell user={r.reporter} /></span> },
            { key: "target", label: "Advertisement", align: "center", render: (r) => r.target?.title ?? (r.reportable_type === "User" ? `User #${r.reportable_id}` : "Removed") },
            { key: "image", label: "Advertisement Image", align: "center", render: (r) => <span className="flex justify-center"><Thumb src={r.target?.image} size={52} /></span> },
            {
              key: "ad_status",
              label: "Advertisement Status",
              align: "center",
              render: (r) =>
                r.target ? (
                  <Toggle
                    checked={r.target.status === "approved"}
                    onChange={async (v) => {
                      await post(`/admin/ads/${r.target.id}/status`, { status: v ? "approved" : "inactive" });
                      toast(v ? "Ad re-activated." : "Ad deactivated.");
                      await list.reload();
                    }}
                  />
                ) : (
                  "-"
                ),
            },
            { key: "status", label: "Report", align: "center", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created_at", label: "Reported", render: (r) => fmtDateTime(r.created_at) },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  {r.target && <IconBtn icon="eye" title="View Ad" href={`/ads/view?id=${r.target.id}`} />}
                  {r.status === "open" && <IconBtn icon="check" title="Mark resolved" tone="brand" onClick={async () => { await post(`/admin/reports/${r.id}/status`, { status: "resolved" }); toast("Report resolved."); await list.reload(); }} />}
                  {r.status === "open" && <IconBtn icon="x" title="Dismiss" onClick={async () => { await post(`/admin/reports/${r.id}/status`, { status: "dismissed" }); toast("Report dismissed."); await list.reload(); }} />}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
