"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, IconBtn, PageHeader, Select, StatusBadge, UserCell, useUi } from "@/components/ui";
import { del, post } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

export default function JobsPage() {
  const { toast, confirm } = useUi();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [status, per]);
  const list = useFetch<any[]>("/admin/jobs", { status, page, per_page: per });

  const setJobStatus = async (id: number, s: string) => {
    await post(`/admin/jobs/${id}/status`, { status: s });
    toast("Job updated.");
    await list.reload();
  };

  return (
    <div>
      <PageHeader title="Job Listings" subtitle="Jobs posted by employers on the marketplace" />
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
          exportName="jobs"
          toolbar={
            <label className="block min-w-48">
              <span className="label">Status</span>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["open", "draft", "closed"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} placeholder="All" />
            </label>
          }
          columns={[
            { key: "title", label: "Title", sortable: true },
            { key: "company_name", label: "Company", sortable: true },
            { key: "employer", label: "Employer", render: (r) => <UserCell user={r.employer} />, value: (r) => r.employer?.name },
            { key: "employment_type", label: "Type", render: (r) => (r.employment_type ?? "-").replace(/_/g, " ") },
            { key: "salary_display", label: "Salary" },
            { key: "city", label: "City" },
            { key: "applications_count", label: "Applicants", align: "center", sortable: true },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created_at", label: "Posted", render: (r) => fmtDate(r.created_at), sortable: true },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Select value={r.status} onChange={(e) => void setJobStatus(r.id, e.target.value)} options={["open", "draft", "closed"].map((s) => ({ value: s, label: s }))} className="w-28 py-1.5" />
                  <IconBtn
                    icon="trash"
                    title="Delete"
                    tone="danger"
                    onClick={async () => {
                      if (await confirm({ message: `Delete job "${r.title}"?` })) {
                        await del(`/admin/jobs/${r.id}`);
                        toast("Job deleted.");
                        await list.reload();
                      }
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
