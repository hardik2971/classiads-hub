"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Card, IconBtn, PageHeader, Select, StatusBadge, Tabs, Thumb, useUi } from "@/components/ui";
import { del } from "@/lib/api";
import { major } from "@/lib/format";
import { useDebounced, useFetch } from "@/lib/hooks";

type Tab = "" | "active" | "inactive" | "discontinued";

export default function PackagesPage() {
  const { toast, confirm } = useUi();
  const [tab, setTab] = useState<Tab>("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [tab, type, q, per]);
  const list = useFetch<any[]>("/admin/crud/packages", { status: tab, type, q, page, per_page: per });

  return (
    <div>
      <PageHeader title="Subscription Packages" actions={<Button onClick={() => (window.location.href = "/packages/form")}>Create Subscription Package</Button>} />
      <Card>
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "", label: "All Packages" },
            { value: "active", label: "Active Packages", tone: "border-success/60 text-success" },
            { value: "inactive", label: "Inactive Packages", tone: "border-warning/70 text-warning" },
            { value: "discontinued", label: "Discontinued Packages", tone: "border-danger/60 text-danger" },
          ]}
        />
        <label className="mt-4 block max-w-xl">
          <span className="label">Package Type</span>
          <Select value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "ad_listing", label: "Item Listing (Ads)" }, { value: "featured_ads", label: "Featured Ads" }]} placeholder="All" />
        </label>
        <div className="mt-4">
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
            exportName="packages"
            columns={[
              { key: "icon", label: "Image", render: (r) => <Thumb src={r.icon_url} size={48} /> },
              { key: "name", label: "Name", sortable: true },
              { key: "type", label: "Type", align: "center", render: (r) => <Badge tone="brand">{r.type === "featured_ads" ? "Featured Ads" : "Item Listing (Ads)"}</Badge> },
              { key: "categories", label: "Categories", align: "center", render: (r) => <Badge tone={r.category_ids?.length ? "accent" : "info"}>{r.category_ids?.length ? "Category Based" : "Global"}</Badge> },
              { key: "price", label: "Price", sortable: true, align: "right", render: (r) => major(r.price) },
              { key: "discount_percent", label: "Discount (%)", sortable: true, align: "center" },
              { key: "final_price", label: "Final Price", sortable: true, align: "right", render: (r) => major(r.final_price) },
              { key: "duration_days", label: "Package Duration", sortable: true, align: "center", render: (r) => r.duration_days ?? "Unlimited" },
              { key: "ad_limit", label: "Ad Limit", align: "center", render: (r) => (r.is_unlimited ? "Unlimited" : (r.ad_limit ?? "-")) },
              { key: "total_revenue", label: "Total Revenue", sortable: true, align: "right", render: (r) => major(r.total_revenue) },
              { key: "active_subscribers", label: "Active Subscribers", sortable: true, align: "center" },
              { key: "status", label: "Package Status", render: (r) => <StatusBadge status={r.status ?? (r.is_active ? "active" : "inactive")} /> },
              {
                key: "actions",
                label: "Action",
                render: (r) => (
                  <div className="flex gap-1.5">
                    <IconBtn icon="edit" title="Edit" href={`/packages/form?id=${r.id}`} />
                    <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: `Delete package "${r.name}"? Existing subscriptions keep working.` })) { await del(`/admin/crud/packages/${r.id}`); toast("Package deleted."); await list.reload(); } }} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
