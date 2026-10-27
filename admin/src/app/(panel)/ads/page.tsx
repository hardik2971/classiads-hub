"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { CategorySelect } from "@/components/form-fields";
import { Icon } from "@/components/icon";
import { Button, Card, IconBtn, Modal, PageHeader, Select, StatusBadge, Tabs, Thumb, Toggle, UserCell, useUi } from "@/components/ui";
import { ApiError, del, post } from "@/lib/api";
import { useDebounced, useFetch, useQueryParam } from "@/lib/hooks";

type Tab = "all" | "active" | "requested" | "admin" | "favorite";
const STATUS_OPTS = ["pending", "approved", "rejected", "sold", "expired", "inactive", "draft"].map((s) => ({ value: s, label: s === "pending" ? "Under Review" : s[0].toUpperCase() + s.slice(1) }));

export default function AdsPage() {
  const { toast, confirm } = useUi();
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [more, setMore] = useState(false);
  const [country, setCountry] = useState("");
  const [featured, setFeatured] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [bulk, setBulk] = useState("");
  const [typeModal, setTypeModal] = useState(false);
  const [adType, setAdType] = useState<"regular" | "video">("regular");
  const countries = useFetch<any[]>("/locations/countries");
  const userId = useQueryParam("user_id");

  const query = useMemo(() => ({ tab: tab === "all" ? "" : tab, category_id: category, status, country_id: country, featured, q, page, per_page: per, user_id: userId ?? "" }), [tab, category, status, country, featured, q, page, per, userId]);
  const list = useFetch<any[]>("/admin/ads", query);
  useEffect(() => setPage(1), [tab, category, status, country, featured, q, per]);

  const reset = () => {
    setCategory("");
    setStatus("");
    setCountry("");
    setFeatured("");
    setSearch("");
  };

  const setAdStatus = async (ids: (string | number)[], s: string) => {
    let reason: string | undefined;
    if (s === "rejected") {
      const r = await confirm({ title: "Reject advertisement", message: "Tell the seller why the ad was rejected.", confirmLabel: "Reject", input: { label: "Reason", required: true } });
      if (!r) return;
      reason = r;
    }
    try {
      await post("/admin/ads/bulk-status", { ids, status: s, reason });
      toast(`${ids.length} ad(s) updated.`);
      setSelected([]);
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Update failed.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!(await confirm({ message: "Delete this advertisement permanently?" }))) return;
    await del(`/admin/ads/${id}`);
    toast("Ad deleted.");
    await list.reload();
  };

  const toggleFeature = async (id: number) => {
    const r = await post(`/admin/ads/${id}/feature`);
    toast(r.message);
    await list.reload();
  };

  return (
    <div>
      <PageHeader title="Advertisements" actions={<Button onClick={() => setTypeModal(true)}>Create Advertisement</Button>} />
      <Card>
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All Advertisements" },
            { value: "active", label: "Active Advertisements", tone: "border-success/60 text-success" },
            { value: "requested", label: "Requested Advertisements", tone: "border-warning/70 text-warning" },
            { value: "admin", label: "Admin Advertisements", tone: "border-secondary/60 text-secondary" },
            { value: "favorite", label: "Favorite Ads", tone: "border-danger/60 text-danger" },
          ]}
        />
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Icon name="info" size={16} /> Select multiple rows using checkboxes to bulk update their status.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
          <label>
            <span className="label">Category</span>
            <CategorySelect value={category} onChange={setCategory} placeholder="All" />
          </label>
          <label>
            <span className="label">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTS} placeholder="All" />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" icon="filter" onClick={() => setMore((v) => !v)} className="border-brand text-brand">
              More Filters
            </Button>
            <Button variant="outline" icon="refresh" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
        {more && (
          <div className="mt-3 grid gap-3 rounded-xl bg-page p-3 sm:grid-cols-3">
            <label>
              <span className="label">Country</span>
              <Select value={country} onChange={(e) => setCountry(e.target.value)} options={(countries.data ?? []).map((c) => ({ value: c.id, label: c.name }))} placeholder="All" />
            </label>
            <label>
              <span className="label">Featured</span>
              <Select value={featured} onChange={(e) => setFeatured(e.target.value)} options={[{ value: "1", label: "Featured only" }, { value: "0", label: "Not featured" }]} placeholder="All" />
            </label>
          </div>
        )}

        <div className="mt-5">
          <DataTable
            selectable
            selected={selected}
            onSelect={setSelected}
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
            exportName="advertisements"
            toolbar={
              selected.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5">
                  <span className="text-sm font-semibold text-brand">{selected.length} selected</span>
                  <Select value={bulk} onChange={(e) => setBulk(e.target.value)} options={STATUS_OPTS.filter((o) => o.value !== "draft")} placeholder="Set status…" className="w-44 py-1.5" />
                  <Button size="sm" disabled={!bulk} onClick={() => void setAdStatus(selected, bulk)}>
                    Apply
                  </Button>
                </div>
              )
            }
            columns={[
              { key: "title", label: "Name", sortable: true, render: (r) => <span className="line-clamp-2 max-w-40">{r.title}</span> },
              { key: "description", label: "Description", render: (r) => <span className="line-clamp-3 max-w-44 text-muted">{r.description}</span> },
              { key: "seller", label: "User", render: (r) => <UserCell user={r.seller} />, value: (r) => r.seller?.name },
              { key: "price", label: "Price", sortable: true, render: (r) => (r.price_type === "free" ? "Free" : r.price != null ? (r.price / 100).toLocaleString() : "-"), value: (r) => r.price },
              { key: "category", label: "Category", sortable: true, render: (r) => r.category?.name ?? "-", value: (r) => r.category?.name },
              { key: "video", label: "Video Ad", render: (r) => (r.video_url ? <a className="text-brand underline" href={r.video_url} target="_blank" rel="noreferrer">Watch</a> : "-") },
              {
                key: "images",
                label: "Images",
                render: (r) => (
                  <div className="flex -space-x-3">
                    {(r.images ?? []).slice(0, 4).map((i: any) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i.id} src={i.url} alt="" className="h-11 w-11 rounded-full border-2 border-white object-cover" />
                    ))}
                    {!(r.images ?? []).length && <Thumb size={40} />}
                  </div>
                ),
              },
              { key: "address", label: "Address", render: (r) => <span className="line-clamp-1 max-w-52">{[r.location?.address, r.location?.city, r.location?.state, r.location?.country].filter(Boolean).join(", ") || "-"}</span> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "featured", label: "Featured", align: "center", render: (r) => <Toggle checked={!!r.is_featured} onChange={() => void toggleFeature(r.id)} /> },
              { key: "active", label: "Active", align: "center", render: (r) => <Toggle checked={r.status === "approved"} onChange={(v) => void setAdStatus([r.id], v ? "approved" : "inactive")} /> },
              {
                key: "actions",
                label: "Action",
                render: (r) => (
                  <div className="flex gap-1.5">
                    <IconBtn icon="eye" title="View" href={`/ads/view?id=${r.id}`} />
                    <IconBtn icon="edit" title="Edit" href={`/ads/create?id=${r.id}`} />
                    <IconBtn icon="trash" title="Delete" tone="danger" onClick={() => void remove(r.id)} />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      <Modal
        open={typeModal}
        onClose={() => setTypeModal(false)}
        title="Select Ads Type"
        size="lg"
        footer={
          <Button className="w-full" onClick={() => (window.location.href = `/ads/create?type=${adType}`)}>
            Next
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["regular", "briefcase", "Regular Ad Listing", "Standard classified advertisement"],
              ["video", "play", "Video Ad Listing", "Create engaging short video advertisements."],
            ] as const
          ).map(([v, icon, title, sub]) => (
            <button key={v} type="button" onClick={() => setAdType(v)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition ${adType === v ? "border-brand bg-brand-50/40" : "border-line hover:border-brand/40"}`}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand">
                <Icon name={icon} size={26} />
              </span>
              <span className="font-semibold">{title}</span>
              <span className="text-sm text-muted">{sub}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}


