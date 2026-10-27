"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, IconBtn, PageHeader, Stars, StatusBadge, UserCell, useUi } from "@/components/ui";
import { post } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

export default function ReviewReports() {
  const { toast, confirm } = useUi();
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [per]);
  const list = useFetch<any[]>("/admin/reviews", { reported: 1, page, per_page: per });

  const decide = async (id: number, decision: "approved" | "rejected") => {
    let reason: string | undefined;
    if (decision === "rejected") {
      const r = await confirm({ title: "Reject report", message: "Explain why the review stays published.", confirmLabel: "Reject report", tone: "primary", input: { label: "Rejection reason", required: true } });
      if (!r) return;
      reason = r;
    } else if (!(await confirm({ message: "Approve the report? The review will be hidden.", confirmLabel: "Approve report", tone: "primary" }))) return;
    await post(`/admin/reviews/${id}/report`, { decision, reason });
    toast("Report resolved.");
    await list.reload();
  };

  return (
    <div>
      <PageHeader title="Seller Review Reports" />
      <Card>
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          pagination={list.meta?.pagination}
          onPage={setPage}
          perPage={per}
          onPerPage={setPer}
          onRefresh={() => void list.reload()}
          exportName="review-reports"
          columns={[
            { key: "reviewee", label: "Seller Name", render: (r) => <UserCell user={r.reviewee} /> },
            { key: "reviewer", label: "Buyer Name", render: (r) => <UserCell user={r.reviewer} /> },
            { key: "ad", label: "Advertisement", render: (r) => r.ad?.title ?? "-" },
            { key: "rating", label: "Ratings", render: (r) => <Stars value={r.rating} /> },
            { key: "comment", label: "Review", render: (r) => <span className="line-clamp-2 max-w-56">{r.comment ?? "-"}</span> },
            { key: "report_status", label: "Report Status", render: (r) => <StatusBadge status={r.report_status === "reported" ? "pending" : r.report_status} label={r.report_status === "reported" ? "Reported" : undefined} /> },
            { key: "report_reason", label: "Report Reason" },
            { key: "report_rejection_reason", label: "Report Rejection Reason", render: (r) => r.report_rejection_reason ?? "-" },
            {
              key: "actions",
              label: "Action",
              render: (r) =>
                r.report_status === "reported" ? (
                  <div className="flex gap-1.5">
                    <IconBtn icon="check" title="Approve report (hide review)" tone="brand" onClick={() => void decide(r.id, "approved")} />
                    <IconBtn icon="x" title="Reject report" tone="danger" onClick={() => void decide(r.id, "rejected")} />
                  </div>
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
