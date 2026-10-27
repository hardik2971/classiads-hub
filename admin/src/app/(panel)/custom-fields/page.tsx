"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { CategorySelect } from "@/components/form-fields";
import { Button, Card, IconBtn, PageHeader, Select, Thumb, useUi } from "@/components/ui";
import { ApiError, del, post } from "@/lib/api";
import { FIELD_TYPES } from "@/lib/constants";
import { useDebounced, useFetch, useQueryParam } from "@/lib/hooks";

export default function CustomFieldsPage() {
  const { toast, confirm } = useUi();
  const initialCat = useQueryParam("category_id");
  const [category, setCategory] = useState<number | "">("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  useEffect(() => {
    if (initialCat) setCategory(Number(initialCat));
  }, [initialCat]);
  useEffect(() => setPage(1), [category, type, q, per]);
  const query = useMemo(() => ({ category_id: category, type, q, page, per_page: per }), [category, type, q, page, per]);
  const list = useFetch<any[]>("/admin/crud/custom_fields", query);

  const remove = async (ids: (string | number)[]) => {
    if (!(await confirm({ message: `Delete ${ids.length} custom field(s)?` }))) return;
    try {
      if (ids.length === 1) await del(`/admin/crud/custom_fields/${ids[0]}`);
      else await post("/admin/crud/custom_fields/bulk", { ids, action: "delete" });
      toast("Deleted.");
      setSelected([]);
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Delete failed.", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Custom Fields" actions={<Button icon="plus" onClick={() => (window.location.href = "/custom-fields/form")}>Create Custom Field</Button>} />
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label>
            <span className="label">Category</span>
            <CategorySelect value={category} onChange={setCategory} placeholder="All" />
          </label>
          <label>
            <span className="label">Type</span>
            <Select value={type} onChange={(e) => setType(e.target.value)} options={FIELD_TYPES} placeholder="All" />
          </label>
        </div>
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
          exportName="custom-fields"
          toolbar={selected.length > 0 && <Button size="sm" variant="danger" icon="trash" onClick={() => void remove(selected)}>Delete {selected.length}</Button>}
          columns={[
            { key: "icon", label: "Image", align: "center", render: (r) => <span className="flex justify-center"><Thumb src={r.icon_url} size={48} /></span> },
            { key: "name", label: "Name", sortable: true, align: "center" },
            { key: "category_paths", label: "Category", align: "center", render: (r) => <div className="space-y-0.5 text-sm">{(r.category_paths ?? []).slice(0, 3).map((p: string) => <p key={p}>{p}</p>)}{(r.category_paths ?? []).length > 3 && <p className="text-muted">+{r.category_paths.length - 3} more</p>}{!(r.category_paths ?? []).length && "-"}</div>, value: (r) => (r.category_paths ?? []).join("; ") },
            { key: "type", label: "Type", sortable: true, align: "center" },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" href={`/custom-fields/form?id=${r.id}`} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={() => void remove([r.id])} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
