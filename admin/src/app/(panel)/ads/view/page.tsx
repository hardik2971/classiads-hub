"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar, Badge, Button, Card, Empty, PageHeader, Spinner, StatusBadge, useUi } from "@/components/ui";
import { ApiError, del, post } from "@/lib/api";
import { fmtDate, fmtNum } from "@/lib/format";
import { useFetch, useQueryParam } from "@/lib/hooks";

export default function AdView() {
  const id = useQueryParam("id");
  const { data: ad, loading, reload } = useFetch<any>(id ? `/ads/${id}` : null);
  const { toast, confirm } = useUi();
  const [img, setImg] = useState(0);
  const [busy, setBusy] = useState("");

  const act = async (key: string, fn: () => Promise<any>) => {
    setBusy(key);
    try {
      const r = await fn();
      toast(r?.message ?? "Done.");
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Action failed.", "error");
    } finally {
      setBusy("");
    }
  };

  if (loading && !ad) return <div className="py-20 text-center text-brand"><Spinner size={32} /></div>;
  if (!ad) return <Empty text="Advertisement not found" />;

  const images = ad.images ?? [];
  return (
    <div>
      <PageHeader
        title={ad.title}
        back={{ href: "/ads", label: "Back to Ads" }}
        actions={
          <>
            {ad.status !== "approved" && (
              <Button variant="success" icon="check" loading={busy === "approve"} onClick={() => void act("approve", () => post(`/admin/ads/${ad.id}/approve`))}>
                Approve
              </Button>
            )}
            {ad.status !== "rejected" && (
              <Button
                variant="danger"
                icon="x"
                loading={busy === "reject"}
                onClick={async () => {
                  const reason = await confirm({ title: "Reject advertisement", message: "The seller will see this reason.", confirmLabel: "Reject", input: { label: "Reason", required: true } });
                  if (reason) await act("reject", () => post(`/admin/ads/${ad.id}/reject`, { reason }));
                }}
              >
                Reject
              </Button>
            )}
            <Button variant="accent" icon="rocket" loading={busy === "feature"} onClick={() => void act("feature", () => post(`/admin/ads/${ad.id}/feature`))}>
              {ad.is_featured ? "Remove Feature" : "Make Featured"}
            </Button>
            <Button variant="outline" icon="edit" onClick={() => (window.location.href = `/ads/create?id=${ad.id}`)}>
              Edit
            </Button>
            <Button
              variant="outline"
              icon="trash"
              className="text-danger"
              onClick={async () => {
                if (await confirm({ message: "Delete this advertisement permanently?" })) {
                  await del(`/admin/ads/${ad.id}`);
                  window.location.href = "/ads";
                }
              }}
            >
              Delete
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <div className="aspect-[16/9] overflow-hidden rounded-xl bg-page">
              {images[img] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[img].url} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Icon name="image" size={48} />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((i: any, idx: number) => (
                  <button key={i.id} onClick={() => setImg(idx)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${idx === img ? "border-brand" : "border-transparent"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.url} alt="" className="h-16 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
            {ad.video_url && (
              <a href={ad.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-brand underline">
                <Icon name="play" size={16} /> Watch video
              </a>
            )}
          </Card>
          <Card title="Description">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#3b3a63]">{ad.description}</p>
          </Card>
          {(ad.custom_fields ?? []).length > 0 && (
            <Card title="Details">
              <dl className="grid gap-3 sm:grid-cols-2">
                {ad.custom_fields.map((f: any) => (
                  <div key={f.custom_field_id} className="rounded-lg bg-page px-3 py-2">
                    <dt className="text-xs text-muted">{f.name}</dt>
                    <dd className="font-medium">{Array.isArray(f.value) ? f.value.join(", ") : String(f.value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-brand">{ad.price_display}</p>
                <p className="mt-1 text-sm capitalize text-muted">{ad.price_type ?? "fixed"} {ad.condition ? `· ${ad.condition}` : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={ad.status} />
                {ad.is_featured && <Badge tone="accent">Featured</Badge>}
              </div>
            </div>
            {ad.rejection_reason && ad.status === "rejected" && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">Rejected: {ad.rejection_reason}</p>}
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Category", ad.category?.name],
                ["Views", fmtNum(ad.views_count)],
                ["Favorites", fmtNum(ad.favorites_count)],
                ["Phone", ad.phone ?? "-"],
                ["Published", fmtDate(ad.published_at)],
                ["Expires", fmtDate(ad.expires_at)],
                ["Created", fmtDate(ad.created_at)],
                ["Ad ID", `#${ad.id}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold">{v ?? "-"}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Seller">
            <div className="flex items-center gap-3">
              <Avatar name={ad.seller?.name} src={ad.seller?.avatar_path} size={48} />
              <div>
                <p className="font-semibold">{ad.seller?.name}</p>
                <p className="text-sm text-muted">{ad.seller?.email ?? ad.seller?.phone}</p>
              </div>
              {ad.seller?.is_verified && <Badge tone="success">Verified</Badge>}
            </div>
            <a href={`/customers?q=${encodeURIComponent(ad.seller?.email ?? ad.seller?.name ?? "")}`} className="mt-4 inline-flex text-sm text-brand underline">
              Open in Customers
            </a>
          </Card>
          <Card title="Location">
            <p className="text-sm">{[ad.location?.address, ad.location?.city, ad.location?.state, ad.location?.country].filter(Boolean).join(", ") || "No address"}</p>
            {ad.location?.latitude != null && (
              <a className="mt-3 inline-flex items-center gap-1 text-sm text-brand underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${ad.location.latitude}&mlon=${ad.location.longitude}#map=15/${ad.location.latitude}/${ad.location.longitude}`}>
                <Icon name="pin" size={15} /> View on map
              </a>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
