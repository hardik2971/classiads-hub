"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Card, Field, IconBtn, Modal, PageHeader, Select, Toggle, UserCell, useUi } from "@/components/ui";
import { ApiError, del, post } from "@/lib/api";
import { useDebounced, useFetch, useQueryParam } from "@/lib/hooks";

export default function CustomersPage() {
  const { toast, confirm } = useUi();
  const initialQ = useQueryParam("q");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [assign, setAssign] = useState<any | null>(null);
  const [pkg, setPkg] = useState("");
  const packages = useFetch<any[]>("/admin/crud/packages", { all: 1 });
  useEffect(() => {
    if (initialQ) setSearch(initialQ);
  }, [initialQ]);
  useEffect(() => setPage(1), [q, status, per]);
  const list = useFetch<any[]>("/admin/users", { customers: 1, q, status, page, per_page: per });

  const setUserStatus = async (r: any, active: boolean) => {
    const s = active ? "active" : "suspended";
    if (!active && !(await confirm({ message: `Suspend ${r.name}? They will be signed out and can't log in.`, confirmLabel: "Suspend" }))) return;
    try {
      await post(`/admin/users/${r.id}/status`, { status: s });
      toast(active ? "Customer activated." : "Customer suspended.");
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed.", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Customers" />
      <Card>
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
          exportName="customers"
          toolbar={
            <label className="min-w-44">
              <span className="label">Status</span>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["active", "suspended", "banned"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} placeholder="All" />
            </label>
          }
          columns={[
            { key: "name", label: "Name", sortable: true, render: (r) => <span className="flex items-center gap-2"><UserCell user={r} />{r.is_verified && <Badge tone="success">✓</Badge>}</span> },
            { key: "email", label: "Email", sortable: true, render: (r) => r.email ?? "-" },
            { key: "phone", label: "Mobile", render: (r) => r.phone ?? "-" },
            { key: "login_type", label: "Type", render: (r) => r.login_type ?? "-" },
            { key: "address", label: "Address", render: (r) => <span className="line-clamp-1 max-w-48">{r.address ?? "-"}</span> },
            { key: "ads_count", label: "Total Post", sortable: true, align: "center" },
            { key: "status", label: "Status", align: "center", render: (r) => <Toggle checked={r.status === "active"} onChange={(v) => void setUserStatus(r, v)} /> },
            {
              key: "auto_approve_ads",
              label: "Auto Approve Advertisement",
              align: "center",
              render: (r) => (
                <Toggle
                  checked={!!r.auto_approve_ads}
                  onChange={async (v) => {
                    await post(`/admin/users/${r.id}/auto-approve`, { enabled: v });
                    toast(v ? "Ads by this customer go live instantly." : "Ads by this customer need approval.");
                    await list.reload();
                  }}
                />
              ),
            },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="plusCircle" title="Assign package" onClick={() => { setPkg(""); setAssign(r); }} />
                  <IconBtn
                    icon="minusCircle"
                    title="Remove active packages"
                    onClick={async () => {
                      if (await confirm({ message: `Cancel all active packages of ${r.name}?`, confirmLabel: "Remove packages" })) {
                        const res = await del(`/admin/users/${r.id}/packages`);
                        toast(`${res.data.cancelled} package(s) removed.`);
                      }
                    }}
                  />
                  <IconBtn icon="ads" title="View ads" href={`/ads?user_id=${r.id}`} />
                </div>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        open={!!assign}
        onClose={() => setAssign(null)}
        title={`Assign package to ${assign?.name ?? ""}`}
        size="sm"
        footer={
          <Button
            disabled={!pkg}
            onClick={async () => {
              try {
                await post(`/admin/users/${assign.id}/packages`, { package_id: Number(pkg) });
                toast("Package assigned.");
                setAssign(null);
              } catch (e) {
                toast(e instanceof ApiError ? e.message : "Failed.", "error");
              }
            }}
          >
            Assign
          </Button>
        }
      >
        <Field label="Package">
          <Select value={pkg} onChange={(e) => setPkg(e.target.value)} options={(packages.data ?? []).filter((p) => p.status !== "discontinued").map((p) => ({ value: p.id, label: `${p.name} (${p.is_unlimited ? "unlimited" : `${p.ad_limit ?? 0} ads`})` }))} placeholder="Select package" />
        </Field>
        <p className="mt-3 text-sm text-muted">The package is activated immediately at no charge and recorded as an admin transaction.</p>
      </Modal>
    </div>
  );
}
