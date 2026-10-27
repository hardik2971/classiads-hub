"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button, Card, IconBtn, PageHeader, Select, Toggle, useUi } from "@/components/ui";
import { del, put } from "@/lib/api";
import { BANNER_PAGES } from "@/lib/constants";
import { useFetch } from "@/lib/hooks";

const label = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

export default function BannerAds() {
  const { toast, confirm } = useUi();
  const [f, setF] = useState({ platform: "", page: "", layout: "", ad_type: "" });
  const [pg, setPg] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPg(1), [f, per]);
  // The banner "page" filter is sent as banner_page: "page" is the pagination parameter.
  const list = useFetch<any[]>("/admin/crud/banner_ads", { platform: f.platform, banner_page: f.page, layout: f.layout, ad_type: f.ad_type, page: pg, per_page: per });

  return (
    <div>
      <PageHeader title="Banner Ads" actions={<Button onClick={() => (window.location.href = "/content/banner-ads/create")}>Create Banner Ad</Button>} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              ["platform", "Platform", [{ value: "web", label: "Website" }, { value: "app", label: "App" }]],
              ["page", "Page", BANNER_PAGES],
              ["layout", "Layout", [{ value: "single", label: "Single" }, { value: "dual", label: "Dual" }]],
              ["ad_type", "Ad Type", [{ value: "category", label: "Category" }, { value: "advertisement", label: "Advertisement" }, { value: "external", label: "External Link" }]],
            ] as const
          ).map(([k, l, opts]) => (
            <label key={k}>
              <span className="label">{l}</span>
              <Select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} options={[...opts]} placeholder="All" />
            </label>
          ))}
        </div>
        <DataTable
          rows={list.data}
          loading={list.loading}
          pagination={list.meta?.pagination}
          onPage={setPg}
          perPage={per}
          onPerPage={setPer}
          onRefresh={() => void list.reload()}
          columns={[
            {
              key: "image",
              label: "Banner Image",
              render: (r) => (
                <div className="flex gap-2">
                  {(r.image_urls ?? []).map((src: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="h-14 w-36 rounded-md border border-line object-cover" />
                  ))}
                </div>
              ),
            },
            { key: "platform", label: "Platform", render: (r) => (r.platform === "web" ? "Website" : "App") },
            { key: "page", label: "Page", render: (r) => label(BANNER_PAGES, r.page) },
            { key: "layout", label: "Layout", render: (r) => (r.layout === "dual" ? "Dual" : "Single") },
            { key: "ad_type", label: "Ad Type", render: (r) => (r.ad_type === "advertisement" ? "Advertisement" : r.ad_type === "external" ? "External Link" : "Category") },
            { key: "is_active", label: "Active", align: "center", render: (r) => <Toggle checked={r.is_active !== false} onChange={async (x) => { await put(`/admin/crud/banner_ads/${r.id}`, { is_active: x }); await list.reload(); }} /> },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" href={`/content/banner-ads/create?id=${r.id}`} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: "Delete this banner?" })) { await del(`/admin/crud/banner_ads/${r.id}`); toast("Banner deleted."); await list.reload(); } }} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
