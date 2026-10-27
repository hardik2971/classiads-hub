"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button, Card, IconBtn, Modal, PageHeader, StatusBadge, Tabs, UserCell, useUi } from "@/components/ui";
import { ApiError, post } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

type Tab = "pending" | "approved" | "rejected" | "";

export default function SellerVerifications() {
  const { toast, confirm } = useUi();
  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [view, setView] = useState<any | null>(null);
  const [busy, setBusy] = useState("");
  useEffect(() => setPage(1), [tab, per]);
  const list = useFetch<any[]>("/admin/verifications", { status: tab, page, per_page: per });

  const approve = async () => {
    setBusy("approve");
    try {
      await post(`/admin/verifications/${view.id}/approve`);
      toast("Seller verified.");
      setView(null);
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed.", "error");
    } finally {
      setBusy("");
    }
  };
  const reject = async () => {
    const reason = await confirm({ title: "Reject verification", message: "The seller will be notified with this reason.", confirmLabel: "Reject", input: { label: "Reason", required: true } });
    if (!reason) return;
    await post(`/admin/verifications/${view.id}/reject`, { reason });
    toast("Verification rejected.");
    setView(null);
    await list.reload();
  };

  return (
    <div>
      <PageHeader title="Seller Verifications" subtitle="Review identity documents submitted for the verified-seller badge" />
      <Card>
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved", tone: "border-success/60 text-success" },
            { value: "rejected", label: "Rejected", tone: "border-danger/60 text-danger" },
            { value: "", label: "All" },
          ]}
        />
        <div className="mt-4">
          <DataTable
            rows={list.data}
            loading={list.loading}
            error={list.error}
            pagination={list.meta?.pagination}
            onPage={setPage}
            perPage={per}
            onPerPage={setPer}
            onRefresh={() => void list.reload()}
            exportName="verifications"
            columns={[
              { key: "user", label: "Seller", render: (r) => <UserCell user={r.user} />, value: (r) => r.user?.name },
              { key: "document_type", label: "Document", render: (r) => (r.document_type ?? "").replace(/_/g, " ") },
              { key: "document_number", label: "Number", render: (r) => r.document_number ?? "-" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "created_at", label: "Submitted", sortable: true, render: (r) => fmtDateTime(r.created_at) },
              { key: "actions", label: "Action", render: (r) => <IconBtn icon="eye" title="Review" onClick={() => setView(r)} /> },
            ]}
          />
        </div>
      </Card>
      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title="Verification request"
        size="lg"
        footer={
          view?.status === "pending" ? (
            <>
              <Button variant="danger" onClick={() => void reject()}>
                Reject
              </Button>
              <Button variant="success" loading={busy === "approve"} onClick={() => void approve()}>
                Approve &amp; verify
              </Button>
            </>
          ) : undefined
        }
      >
        {view && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <UserCell user={view.user} />
              <StatusBadge status={view.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Document type</dt>
                <dd className="font-semibold capitalize">{(view.document_type ?? "").replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-muted">Document number</dt>
                <dd className="font-semibold">{view.document_number ?? "-"}</dd>
              </div>
              {Object.entries(view.fields ?? {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold">{String(v).startsWith("http") ? <a className="text-brand underline" href={String(v)} target="_blank" rel="noreferrer">Open file</a> : String(v)}</dd>
                </div>
              ))}
            </dl>
            {view.rejection_reason && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">Rejected: {view.rejection_reason}</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Front", view.front_image],
                ["Back", view.back_image],
                ["Selfie", view.selfie_image],
              ].map(([l, src]) =>
                src ? (
                  <a key={l} href={src} target="_blank" rel="noreferrer" className="block">
                    <p className="mb-1 text-xs text-muted">{l}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={l} className="h-40 w-full rounded-lg border border-line object-cover" />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
