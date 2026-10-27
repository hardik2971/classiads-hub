"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button, Card, IconBtn, PageHeader, Select, StatusBadge, Thumb, useUi } from "@/components/ui";
import { del } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useDebounced, useFetch } from "@/lib/hooks";

export default function BlogsPage() {
  const { toast, confirm } = useUi();
  const cats = useFetch<any[]>("/admin/crud/blog_categories", { all: 1 });
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [cat, q, per]);
  const list = useFetch<any[]>("/admin/blog", { blog_category_id: cat, q, page, per_page: per });

  return (
    <div>
      <PageHeader title="Blogs" actions={<Button icon="plus" onClick={() => (window.location.href = "/blogs/form")}>Add Blog</Button>} />
      <Card>
        <label className="mb-4 block max-w-md">
          <span className="label">Category</span>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} placeholder="All" />
        </label>
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          pagination={list.meta?.pagination}
          onPage={setPage}
          perPage={per}
          onPerPage={setPer}
          search={search}
          onSearch={setSearch}
          onRefresh={() => void list.reload()}
          exportName="blogs"
          columns={[
            { key: "title", label: "Title", sortable: true, render: (r) => <span className="line-clamp-3 max-w-56">{r.title}</span> },
            { key: "category", label: "Category", sortable: true, render: (r) => r.category ?? "-" },
            { key: "slug", label: "Slug", render: (r) => <span className="line-clamp-2 max-w-44 break-all text-muted">{r.slug}</span> },
            { key: "excerpt", label: "Description", render: (r) => <span className="line-clamp-3 max-w-56">{r.excerpt ?? "-"}</span> },
            { key: "image", label: "Image", render: (r) => <Thumb src={r.cover_image} size={56} /> },
            { key: "tags", label: "Tags", render: (r) => <span className="line-clamp-3 max-w-56">{(r.tags ?? []).join(", ") || "-"}</span> },
            { key: "views_count", label: "Views", sortable: true, align: "center" },
            { key: "useful_count", label: "Useful", sortable: true, align: "center", render: (r) => r.useful_count ?? 0 },
            { key: "not_useful_count", label: "Not Useful", sortable: true, align: "center", render: (r) => r.not_useful_count ?? 0 },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created_at", label: "Date", sortable: true, render: (r) => fmtDateTime(r.published_at ?? r.created_at) },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" href={`/blogs/form?id=${r.id}`} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: `Delete "${r.title}"?` })) { await del(`/admin/blog/${r.id}`); toast("Post deleted."); await list.reload(); } }} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
