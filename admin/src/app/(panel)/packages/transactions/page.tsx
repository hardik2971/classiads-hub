"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Badge, Card, IconBtn, Modal, PageHeader, Select, StatusBadge, UserCell, useUi } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

const STATUS_LABEL: Record<string, string> = { completed: "Succeed", pending: "Pending", failed: "Failed", refunded: "Refunded" };

export default function Transactions() {
  const { toast, confirm } = useUi();
  const [status, setStatus] = useState("");
  const [gateway, setGateway] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [view, setView] = useState<any | null>(null);
  useEffect(() => setPage(1), [status, gateway, per]);
  const list = useFetch<any[]>("/admin/transactions", { status, gateway, page, per_page: per });
  const gws = useFetch<any[]>("/admin/payment-gateways");

  const refund = async (id: number) => {
    if (!(await confirm({ message: "Refund this transaction? The purchased package/feature will be revoked.", confirmLabel: "Refund" }))) return;
    try {
      await post(`/admin/transactions/${id}/refund`);
      toast("Transaction refunded.");
      setView(null);
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Refund failed.", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Payment Transactions" />
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
          exportName="transactions"
          toolbar={
            <div className="flex flex-wrap gap-3">
              <label className="min-w-44">
                <span className="label">Status</span>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} placeholder="All" />
              </label>
              <label className="min-w-44">
                <span className="label">Gateway</span>
                <Select value={gateway} onChange={(e) => setGateway(e.target.value)} options={(gws.data ?? []).map((g) => ({ value: g.code, label: g.name }))} placeholder="All" />
              </label>
            </div>
          }
          columns={[
            { key: "user", label: "User Name", render: (r) => <UserCell user={r.user} />, value: (r) => r.user?.name },
            { key: "total", label: "Amount", align: "center", sortable: true, render: (r) => r.total_display, value: (r) => r.total },
            { key: "type", label: "Type", align: "center", render: (r) => <Badge tone="soft">{r.type === "featured_ad" ? "Featured Ad" : "Subscription"}</Badge> },
            { key: "gateway", label: "Payment Gateway", align: "center", render: (r) => (gws.data ?? []).find((g) => g.code === r.gateway)?.name ?? r.gateway },
            { key: "status", label: "Payment Status", align: "center", render: (r) => <StatusBadge status={r.status} label={r.status === "pending" && r.receipt_url ? "Under review" : STATUS_LABEL[r.status]} /> },
            { key: "created_at", label: "Created At", align: "center", sortable: true, render: (r) => fmtDateTime(r.created_at) },
            { key: "actions", label: "Action", render: (r) => <IconBtn icon="receipt" title="Details" onClick={() => setView(r)} /> },
          ]}
        />
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} title={`Transaction #${view?.id ?? ""}`}>
        {view && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["User", view.user?.name],
              ["Status", STATUS_LABEL[view.status] ?? view.status],
              ["Type", view.type],
              ["Gateway", view.gateway],
              ["Reference", view.reference ?? "-"],
              ["Amount", view.total_display],
              ["Tax", ((view.tax_amount ?? 0) / 100).toFixed(2)],
              ["Package", view.package?.name ?? "-"],
              ["Ad", view.ad?.title ?? "-"],
              ["Invoice", view.invoice?.number ?? "-"],
              ["Paid at", fmtDateTime(view.paid_at)],
              ["Created", fmtDateTime(view.created_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
            {view.receipt_url && (
              <div className="col-span-2">
                <dt className="mb-1 text-muted">Receipt</dt>
                <a href={view.receipt_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={view.receipt_url} alt="Receipt" className="max-h-72 rounded-lg border border-line" />
                </a>
              </div>
            )}
            {view.status === "completed" && (
              <div className="col-span-2 flex justify-end">
                <button onClick={() => void refund(view.id)} className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5">
                  Refund
                </button>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </div>
  );
}
