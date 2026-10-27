"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, cx, PageHeader, Select, Spinner, useUi } from "@/components/ui";
import { post } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

export default function CategoryOrder() {
  const { toast } = useUi();
  const { data, loading } = useFetch<any[]>("/admin/crud/categories", { all: 1 });
  const [parent, setParent] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems((data ?? []).filter((c) => String(c.parent_id ?? "") === parent).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  }, [data, parent]);

  const drop = (target: number) => {
    if (drag === null || drag === target) return;
    const list = [...items];
    const from = list.findIndex((x) => x.id === drag);
    const to = list.findIndex((x) => x.id === target);
    const [m] = list.splice(from, 1);
    list.splice(to, 0, m);
    setItems(list);
    setDrag(null);
  };

  const save = async () => {
    setSaving(true);
    await post("/admin/crud/categories/reorder", { ids: items.map((i) => i.id) });
    setSaving(false);
    toast("Category order saved.");
  };

  const parents = (data ?? []).filter((c) => (data ?? []).some((x) => x.parent_id === c.id));

  return (
    <div>
      <PageHeader title="Change Categories Order" back={{ href: "/categories", label: "Back to All Categories" }} actions={<Button loading={saving} icon="check" onClick={() => void save()}>Save Order</Button>} />
      <Card>
        <div className="mb-5 max-w-sm">
          <span className="label">Level</span>
          <Select value={parent} onChange={(e) => setParent(e.target.value)} options={parents.map((p) => ({ value: p.id, label: `Subcategories of ${p.name}` }))} placeholder="Main categories" />
        </div>
        <p className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Icon name="drag" size={16} /> Drag cards to reorder, then save.
        </p>
        {loading && !data ? (
          <Spinner />
        ) : (
          <div className="grid gap-3 rounded-xl bg-page p-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={() => setDrag(c.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(c.id)}
                className={cx("flex cursor-grab items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-sm active:cursor-grabbing", drag === c.id && "opacity-50")}
              >
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand">
                  {c.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon_url} alt="" className="h-12 w-12 object-contain" />
                  ) : (
                    <Icon name="tag" size={26} />
                  )}
                </span>
                <span className="text-[15px]">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
