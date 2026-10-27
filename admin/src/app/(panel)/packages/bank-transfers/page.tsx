"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button, Card, IconBtn, Modal, PageHeader, StatusBadge, Thumb, UserCell, useUi } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

const label = (r: any) => (r.status === "pending" ? (r.receipt_url ? "Under review" : "Pending") : r.status === "completed" ? "Approved" : r.status);

export default function BankTransfers() {
  const { toast } = useUi();
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [view, setView] = useState<any | null>(null);
  const [busy, setBusy] = useState("");
  useEffect(() => setPage(1), [per]);
  const list = useFetch<any[]>("/admin/transactions", { gateway: "bank_transfer", page, per_page: per });

  const decide = async (action: "confirm" | "reject") => {
    setBusy(action);
    try {
      await post(`/admin/transactions/${view.id}/${action}`);
      toast(action === "confirm" ? "Payment approved — purchase activated." : "Payment rejected.");
      setView(null);
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Action failed.", "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <PageHeader title="Bank Transfers" />
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
          exportName="bank-transfers"
          columns={[
            { key: "user", label: "User Name", render: (r) => <UserCell user={r.user} />, value: (r) => r.user?.name },
            { key: "total", label: "Amount", align: "center", render: (r) => r.total_display, value: (r) => r.total },
            { key: "status", label: "Payment Status", align: "center", render: (r) => <StatusBadge status={r.status === "pending" && r.receipt_url ? "under_review" : r.status} label={label(r)} /> },
            {
              key: "receipt",
              label: "Payment Receipt",
              align: "center",
              render: (r) =>
                r.receipt_url ? (
                  <a href={r.receipt_url} target="_blank" rel="noreferrer" className="inline-flex">
                    <Thumb src={r.receipt_url} size={56} />
                  </a>
                ) : (
                  "-"
                ),
            },
            { key: "reference", label: "Reference", align: "center" },
            { key: "created_at", label: "Created At", align: "center", sortable: true, render: (r) => fmtDateTime(r.created_at) },
            { key: "actions", label: "Action", render: (r) => <IconBtn icon="edit" title="Review" onClick={() => setView(r)} /> },
          ]}
        />
      </Card>
      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title="Review bank transfer"
        footer={
          view?.status === "pending" ? (
            <>
              <Button variant="danger" loading={busy === "reject"} onClick={() => void decide("reject")}>
                Reject
              </Button>
              <Button variant="success" loading={busy === "confirm"} onClick={() => void decide("confirm")}>
                Approve payment
              </Button>
            </>
          ) : undefined
        }
      >
        {view && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted">User:</span> <b>{view.user?.name}</b>
            </p>
            <p>
              <span className="text-muted">Amount:</span> <b>{view.total_display}</b> · {view.type === "featured_ad" ? `Feature "${view.ad?.title ?? ""}"` : view.package?.name}
            </p>
            <p>
              <span className="text-muted">Reference:</span> <b>{view.reference ?? "-"}</b>
            </p>
            <p>
              <span className="text-muted">Status:</span> <StatusBadge status={view.status} label={label(view)} />
            </p>
            {view.receipt_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={view.receipt_url} alt="Receipt" className="max-h-96 w-full rounded-lg border border-line object-contain" />
            ) : (
              <p className="rounded-lg bg-page px-3 py-2 text-muted">The customer hasn&apos;t uploaded a receipt yet.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
