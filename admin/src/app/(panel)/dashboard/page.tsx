"use client";

import { useState } from "react";
import { BarChart, Donut } from "@/components/charts";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Avatar, Card, Select, StatusBadge, Thumb, UserCell } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtNum, timeAgo } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

const STATUS_COLORS: Record<string, string> = {
  approved: "#3B82F6",
  pending: "#22C55E",
  sold: "#272757",
  expired: "#F97316",
  rejected: "#EF4444",
  inactive: "#9CA3AF",
  draft: "#FFBF00",
};

function Kpi({ label, value, icon, tint, big }: { label: string; value: number | string; icon: string; tint: string; big?: boolean }) {
  return (
    <div className={`flex rounded-2xl bg-white p-5 ring-1 ring-line/70 ${big ? "min-h-[200px] flex-col justify-between" : "items-center gap-4"}`}>
      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: `${tint}1f`, color: tint }}>
        <Icon name={icon} size={24} />
      </span>
      <div>
        <p className="text-lg text-muted">{label}</p>
        <p className="text-2xl font-semibold text-ink">{typeof value === "number" ? fmtNum(value) : value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: d, loading } = useFetch<any>("/admin/dashboard", { year });
  const k = d?.kpis ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Welcome back, {user?.name?.split(" ")[0] ?? "admin"}!</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total Ads" value={k.total_ads ?? 0} icon="grid" tint="#0EA5E9" />
        <Kpi label="Featured Ads" value={k.featured_ads ?? 0} icon="rocket" tint="#8B5CF6" />
        <Kpi label="Active Ads" value={k.active_ads ?? 0} icon="badge" tint="#272757" />
        <Kpi label="Expired Ads" value={k.expired_ads ?? 0} icon="hourglass" tint="#EF4444" />
        <Kpi label="Sold Ads" value={k.sold_ads ?? 0} icon="handshake" tint="#10B981" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_2.2fr]">
        <div className="grid gap-4">
          <Kpi big label="All Users" value={k.total_users ?? 0} icon="users" tint="#505081" />
          <Kpi big label="Favorite Ads" value={k.favorite_ads ?? 0} icon="bookmark" tint="#EC4899" />
        </div>
        <div className="grid gap-4">
          <Kpi big label="Subscriptions" value={k.subscriptions ?? 0} icon="diamond" tint="#F97316" />
          <Kpi big label="Total Reviews" value={k.total_reviews ?? 0} icon="userStar" tint="#FFBF00" />
        </div>
        <Card
          title={
            <div>
              <h2 className="text-lg font-semibold">Revenue</h2>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-6 rounded-full bg-brand" /> Subscription
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-6 rounded-full bg-accent" /> Feature Ads
                </span>
                <span className="font-semibold text-brand">Total {k.total_revenue_display ?? "USD 0.00"}</span>
              </div>
            </div>
          }
          actions={<Select value={year} onChange={(e) => setYear(Number(e.target.value))} options={[0, 1, 2].map((i) => ({ value: new Date().getFullYear() - i, label: i === 0 ? "This Year" : String(new Date().getFullYear() - i) }))} className="w-36" />}
        >
          <BarChart
            data={d?.revenue?.monthly ?? Array.from({ length: 12 }, () => ({}))}
            series={[
              { key: "subscription", label: "Subscription", color: "#272757" },
              { key: "featured_ad", label: "Feature Ads", color: "#FFBF00" },
            ]}
          />
        </Card>
      </div>

      <Card title="Recent Ads" actions={<a href="/ads" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-brand hover:text-brand">View All</a>}>
        <DataTable
          loading={loading}
          rows={d?.recent_ads ?? null}
          columns={[
            { key: "image", label: "Image", render: (r) => <Thumb src={r.images?.[0]?.url} /> },
            { key: "title", label: "Name", sortable: true },
            { key: "seller", label: "User", render: (r) => <UserCell user={r.seller} />, value: (r) => r.seller?.name },
            { key: "price", label: "Price", sortable: true, render: (r) => r.price_display, value: (r) => r.price },
            { key: "category", label: "Category", render: (r) => r.category?.name ?? "-", value: (r) => r.category?.name },
            { key: "address", label: "Address", render: (r) => <span className="line-clamp-1 max-w-56">{[r.location?.address, r.location?.city, r.location?.country].filter(Boolean).join(", ") || "-"}</span> },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created_at", label: "Created", sortable: true, render: (r) => fmtDate(r.created_at) },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <a href={`/ads/view?id=${r.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-[#f7f7fb] hover:text-brand" title="View">
                  <Icon name="eye" size={15} />
                </a>
              ),
            },
          ]}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card title="Recent Reports" actions={<a href="/reports/users" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-brand hover:text-brand">View All</a>}>
          <DataTable
            loading={loading}
            rows={d?.recent_reports ?? null}
            columns={[
              { key: "image", label: "Image", render: (r) => <Thumb src={r.ad?.image} /> },
              { key: "ad", label: "Advertisement", render: (r) => <span className="line-clamp-2 max-w-48">{r.ad?.title ?? "User report"}</span> },
              { key: "owner", label: "Item Owner", render: (r) => <UserCell user={r.ad?.owner} /> },
              { key: "reporter", label: "User", render: (r) => <UserCell user={r.reporter} /> },
              { key: "reason", label: "Reason" },
              { key: "ad_status", label: "Ad Status", render: (r) => (r.ad ? <StatusBadge status={r.ad.status} /> : "-") },
            ]}
          />
        </Card>
        <Card title="Recent Chats" actions={<a href="/chat" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-brand hover:text-brand">View All</a>}>
          <ul className="divide-y divide-line">
            {(d?.recent_chats ?? []).map((c: any) => (
              <li key={c.id}>
                <a href={`/chat?ad=${c.ad?.id ?? ""}&c=${c.id}`} className="flex items-center gap-3 py-3 hover:bg-[#fafafd]">
                  <span className="relative">
                    <Thumb src={c.ad?.image} size={44} />
                    <span className="absolute -bottom-1 -right-1">
                      <Avatar name={c.buyer?.name} src={c.buyer?.avatar_path} size={18} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.ad?.title ?? "Deleted ad"}</span>
                    <span className="block truncate text-sm text-muted">{c.buyer?.name}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-sm text-muted">
                    {timeAgo(c.last_message_at)}
                    {c.unread > 0 && <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs text-white">{c.unread}</span>}
                  </span>
                </a>
              </li>
            ))}
            {!loading && !(d?.recent_chats ?? []).length && <li className="py-8 text-center text-sm text-muted">No chats yet</li>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Ads Statistics">
          <Donut items={Object.entries(d?.ads_by_status ?? {}).map(([k2, v]) => ({ label: k2 === "pending" ? "Under Review" : k2[0].toUpperCase() + k2.slice(1), value: v as number, color: STATUS_COLORS[k2] }))} />
        </Card>
        <Card title="Top 5 Categories by Ads">
          <Donut items={(d?.top_categories ?? []).map((c: any) => ({ label: c.name, value: c.count }))} />
        </Card>
        <Card title="Top Sold Items by Category">
          <Donut items={(d?.sold_by_category ?? []).map((c: any) => ({ label: c.name, value: c.count }))} />
        </Card>
        <Card title="Customer Statistics">
          <Donut
            items={[
              { label: "Active", value: d?.customer_stats?.active ?? 0, color: "#22C55E" },
              { label: "Inactive", value: d?.customer_stats?.inactive ?? 0, color: "#505081" },
            ]}
          />
        </Card>
      </div>

      <Card title="Top Customer" actions={<a href="/customers" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-brand hover:text-brand">View All</a>}>
        <DataTable
          loading={loading}
          rows={(d?.top_customers ?? []).map((t: any, i: number) => ({ ...t, id: t.user?.id ?? i }))}
          columns={[
            { key: "profile", label: "Profile", align: "center", render: (r) => <span className="flex justify-center"><Avatar name={r.user?.name} src={r.user?.avatar_path} size={34} /></span> },
            { key: "name", label: "Name", sortable: true, render: (r) => r.user?.name, value: (r) => r.user?.name },
            { key: "ads", label: "Ads", sortable: true, align: "center" },
            { key: "sold", label: "Sold Item", sortable: true, align: "center" },
          ]}
        />
      </Card>

      <Card title="Most Viewed">
        <DataTable
          loading={loading}
          rows={d?.most_viewed ?? null}
          columns={[
            { key: "image", label: "Image", render: (r) => <Thumb src={r.images?.[0]?.url} /> },
            { key: "title", label: "Ad Title", sortable: true },
            { key: "seller", label: "User", render: (r) => <UserCell user={r.seller} /> },
            { key: "category", label: "Category", render: (r) => r.category?.name ?? "-" },
            { key: "views_count", label: "View", sortable: true, align: "center" },
            { key: "location", label: "Location", render: (r) => [r.location?.city, r.location?.state].filter(Boolean).join(", ") || "-" },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <a href={`/ads/view?id=${r.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-[#f7f7fb] hover:text-brand" title="View">
                  <Icon name="eye" size={15} />
                </a>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
