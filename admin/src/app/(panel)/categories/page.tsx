"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { Button, Card, IconBtn, PageHeader, Thumb, Toggle, useUi } from "@/components/ui";
import { ApiError, del, put } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

export default function CategoriesPage() {
  const { toast, confirm } = useUi();
  const { data, loading, error, reload, setData } = useFetch<any[]>("/admin/crud/categories", { all: 1 });
  const [open, setOpen] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const all = data ?? [];
    if (search) return all.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((c) => ({ ...c, depth: 0 }));
    const out: any[] = [];
    const walk = (pid: number | null, depth: number) => {
      for (const c of all.filter((x) => (x.parent_id ?? null) === pid)) {
        out.push({ ...c, depth });
        if (open.includes(c.id)) walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }, [data, open, search]);

  const toggle = async (row: any, v: boolean) => {
    setData((d) => d?.map((c) => (c.id === row.id ? { ...c, is_active: v } : c)) ?? null);
    await put(`/admin/crud/categories/${row.id}`, { is_active: v }).catch(() => reload());
  };
  const remove = async (row: any) => {
    if (!(await confirm({ message: `Delete "${row.name}"?` }))) return;
    try {
      await del(`/admin/crud/categories/${row.id}`);
      toast("Category deleted.");
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Delete failed.", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        actions={
          <>
            <Button icon="plus" onClick={() => (window.location.href = "/categories/form")}>
              Add Category
            </Button>
            <Button variant="success" icon="upload" onClick={() => (window.location.href = "/categories/bulk")}>
              Bulk Upload
            </Button>
          </>
        }
      />
      <Card>
        <a href="/categories/order" className="mb-2 inline-flex items-center gap-1 text-brand hover:underline">
          <Icon name="plus" size={15} /> Set Order of Categories
        </a>
        <DataTable
          rows={rows}
          loading={loading}
          error={error}
          search={search}
          onSearch={setSearch}
          onRefresh={() => void reload()}
          exportName="categories"
          columns={[
            {
              key: "name",
              label: "Name",
              sortable: true,
              render: (r) => (
                <span className="flex items-center gap-2" style={{ paddingLeft: r.depth * 26 }}>
                  {r.subcategories_count > 0 ? (
                    <button onClick={() => setOpen((o) => (o.includes(r.id) ? o.filter((x) => x !== r.id) : [...o, r.id]))} className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand text-brand">
                      <Icon name={open.includes(r.id) ? "minusCircle" : "plus"} size={14} />
                    </button>
                  ) : (
                    <span className="w-6" />
                  )}
                  {r.name}
                </span>
              ),
            },
            { key: "image", label: "Image", align: "center", render: (r) => <span className="flex justify-center"><Thumb src={r.icon_url ?? r.image_url} size={44} /></span> },
            { key: "subcategories_count", label: "Subcategories", align: "center", render: (r) => `${r.subcategories_count} Subcategories` },
            { key: "custom_fields_count", label: "Custom Fields", align: "center", render: (r) => `${r.custom_fields_count} Custom Fields` },
            { key: "ads_count", label: "Advertisement Count", align: "center", sortable: true },
            { key: "is_active", label: "Active", align: "center", render: (r) => <Toggle checked={r.is_active !== false} onChange={(v) => void toggle(r, v)} /> },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" href={`/categories/form?id=${r.id}`} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={() => void remove(r)} />
                  <IconBtn icon="list" title="Custom fields" href={`/custom-fields?category_id=${r.id}`} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
