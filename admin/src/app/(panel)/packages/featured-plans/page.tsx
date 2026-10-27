"use client";

import { CrudPage } from "@/components/crud-page";
import { major } from "@/lib/format";

export default function FeaturedPlans() {
  return (
    <CrudPage
      title="Featured Ad Plans"
      subtitle="Pricing for promoting a single advertisement to Featured"
      resource="featured_ad_plans"
      singular="Plan"
      activeToggle
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "description", label: "Description", render: (r) => <span className="line-clamp-2 max-w-72">{r.description ?? "-"}</span> },
        { key: "price", label: "Price", sortable: true, align: "right", render: (r) => `${r.currency_code ?? ""} ${major(r.price)}` },
        { key: "duration_days", label: "Duration (Days)", sortable: true, align: "center" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true, span: 2 },
        { name: "description", label: "Description", type: "textarea", span: 2 },
        { name: "price", label: "Price", type: "number", required: true },
        { name: "currency_code", label: "Currency (ISO)", placeholder: "USD" },
        { name: "duration_days", label: "Duration (Days)", type: "number", required: true },
        { name: "sort_order", label: "Sort order", type: "number" },
      ]}
      toForm={(r) => ({ ...r, price: (r.price ?? 0) / 100 })}
      defaults={{ currency_code: "USD", is_active: true, duration_days: 7 }}
    />
  );
}
