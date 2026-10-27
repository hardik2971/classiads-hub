"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, IconBtn, Modal, PageHeader, Select, Stars, Toggle, UserCell, useUi } from "@/components/ui";
import { del, post } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

export default function SellerReviews() {
  const { toast, confirm } = useUi();
  const [type, setType] = useState("seller_review");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [full, setFull] = useState<string | null>(null);
  useEffect(() => setPage(1), [type, per]);
  const list = useFetch<any[]>("/admin/reviews", { type, page, per_page: per });

  return (
    <div>
      <PageHeader title="Seller Reviews" />
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
          exportName="reviews"
          toolbar={
            <label className="min-w-52">
              <span className="label">Review type</span>
              <Select value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "seller_review", label: "Buyer → Seller" }, { value: "buyer_review", label: "Seller → Buyer" }]} placeholder="All" />
            </label>
          }
          columns={[
            { key: "reviewee", label: "Seller Name", render: (r) => <UserCell user={r.type === "seller_review" ? r.reviewee : r.reviewer} /> },
            { key: "reviewer", label: "Buyer Name", render: (r) => <UserCell user={r.type === "seller_review" ? r.reviewer : r.reviewee} /> },
            { key: "ad", label: "Advertisement", render: (r) => <span className="line-clamp-2 max-w-64">{r.ad?.title ?? "-"}</span> },
            { key: "rating", label: "Ratings", sortable: true, render: (r) => <Stars value={r.rating} /> },
            {
              key: "comment",
              label: "Review",
              render: (r) =>
                r.comment && r.comment.length > 50 ? (
                  <span>
                    {r.comment.slice(0, 50)}…{" "}
                    <button className="text-brand" onClick={() => setFull(r.comment)}>
                      View More
                    </button>
                  </span>
                ) : (
                  (r.comment ?? "-")
                ),
            },
            { key: "is_approved", label: "Visible", align: "center", render: (r) => <Toggle checked={r.is_approved} onChange={async (v) => { await post(`/admin/reviews/${r.id}/approval`, { is_approved: v }); toast(v ? "Review published." : "Review hidden."); await list.reload(); }} /> },
            { key: "actions", label: "Action", render: (r) => <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: "Delete this review? The seller's rating is recalculated." })) { await del(`/admin/reviews/${r.id}`); toast("Review deleted."); await list.reload(); } }} /> },
          ]}
        />
      </Card>
      <Modal open={!!full} onClose={() => setFull(null)} title="Review" size="sm">
        <p className="whitespace-pre-line text-sm">{full}</p>
      </Modal>
    </div>
  );
}
