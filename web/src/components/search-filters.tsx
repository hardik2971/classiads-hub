"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";

const SORTS = [
  ["", "Relevance"],
  ["newest", "Newest"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["most_viewed", "Most Viewed"],
];

const CONDITIONS = [
  ["", "Any condition"],
  ["new", "New"],
  ["used", "Used"],
  ["refurbished", "Refurbished"],
];

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [priceMin, setPriceMin] = useState(sp.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(sp.get("price_max") ?? "");

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  const activeCat = sp.get("category_slug") ?? "";

  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => update({ category_slug: undefined })}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${!activeCat ? "bg-brand/10 font-medium text-brand" : "hover:bg-black/[0.04]"}`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ category_slug: c.slug })}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${activeCat === c.slug ? "bg-brand/10 font-medium text-brand" : "hover:bg-black/[0.04]"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Price range</h3>
        <div className="flex items-center gap-2">
          <input
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            inputMode="numeric"
            className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none"
          />
          <span className="text-muted">–</span>
          <input
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            inputMode="numeric"
            className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none"
          />
        </div>
        <Button
          size="sm"
          fullWidth
          className="mt-3"
          onClick={() => update({ price_min: priceMin, price_max: priceMax })}
        >
          Apply
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">Condition</h3>
        <select
          value={sp.get("condition") ?? ""}
          onChange={(e) => update({ condition: e.target.value })}
          className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none"
        >
          {CONDITIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}

export function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <select
      value={sp.get("sort") ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(sp.toString());
        if (e.target.value) next.set("sort", e.target.value);
        else next.delete("sort");
        next.delete("page");
        router.push(`/search?${next.toString()}`);
      }}
      className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none"
    >
      {SORTS.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
