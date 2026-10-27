"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { CategorySelect } from "@/components/form-fields";
import { Icon } from "@/components/icon";
import { Badge, Button, Card, IconBtn, PageHeader, Thumb, Toggle, useUi } from "@/components/ui";
import { get, put } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

const SECTIONS = [
  ["show_all_categories", "All Categories"],
  ["show_slider", "Slider"],
  ["show_popular_categories", "Popular Categories"],
  ["show_featured_section", "Featured Section"],
  ["show_all_advertisement", "All Advertisement"],
] as const;

export default function HomeScreen() {
  const { toast } = useUi();
  const cats = useFetch<any[]>("/admin/crud/categories", { all: 1 });
  const [home, setHome] = useState<Record<string, any> | null>(null);
  const [pick, setPick] = useState<number | "">("");

  useEffect(() => {
    void get("/admin/settings", { group: "home" }).then((r) => setHome(r.data.home ?? {}));
  }, []);

  const save = async (patch: Record<string, any>, msg = "Saved.") => {
    const next = { ...(home ?? {}), ...patch };
    setHome(next);
    await put("/admin/settings", { group: "home", settings: patch });
    toast(msg);
  };

  const popular: number[] = (home?.popular_categories ?? []).map(Number);
  const rows = popular.map((id, i) => ({ ...(cats.data ?? []).find((c) => c.id === id), id, seq: i + 1 }));

  return (
    <div>
      <PageHeader title="Home Screen Sections" />
      <Card title="Section Visibility">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SECTIONS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-line px-5 py-8">
              <span className="text-[15px]">{label}</span>
              <Toggle checked={home?.[key] !== false} onChange={(v) => void save({ [key]: v }, `${label} ${v ? "shown" : "hidden"}.`)} />
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-6" title="Popular Categories">
        <div className="mb-5 rounded-xl border border-line bg-page p-4">
          <p className="flex items-center gap-2 font-semibold">
            <Icon name="plusCircle" size={18} className="text-brand" /> Add Category
          </p>
          <p className="mb-3 text-sm text-muted">Search and select a category to add to the popular list</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-72 flex-1">
              <span className="label">Category</span>
              <CategorySelect value={pick} onChange={setPick} placeholder="All" />
            </label>
            <Button icon="plus" disabled={!pick || popular.includes(Number(pick))} onClick={() => { void save({ popular_categories: [...popular, Number(pick)] }, "Category added."); setPick(""); }}>
              Add
            </Button>
          </div>
        </div>
        <DataTable
          rows={rows}
          onReorder={(ids) => void save({ popular_categories: ids.map(Number) }, "Order saved.")}
          columns={[
            { key: "seq", label: "Sequence" },
            { key: "image", label: "Image", render: (r) => <Thumb src={r.icon_url} size={36} /> },
            { key: "name", label: "Name" },
            { key: "type", label: "Type", render: (r) => <Badge tone={r.parent_id ? "soft" : "brand"}>{r.parent_id ? "Sub Category" : "Main Category"}</Badge> },
            { key: "actions", label: "Action", render: (r) => <IconBtn icon="trash" title="Remove" tone="danger" onClick={() => void save({ popular_categories: popular.filter((x) => x !== r.id) }, "Category removed.")} /> },
          ]}
        />
      </Card>
    </div>
  );
}
