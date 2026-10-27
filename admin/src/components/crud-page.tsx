"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, put, toForm } from "@/lib/api";
import { useDebounced, useFetch } from "@/lib/hooks";
import { Column, DataTable } from "./data-table";
import { FieldDef, FormField, LangTabs } from "./form-fields";
import { Button, Card, cx, IconBtn, Modal, PageHeader, Select, Toggle, useUi } from "./ui";

export interface CrudConfig {
  title: string;
  resource: string;
  singular: string;
  columns: Column<any>[];
  fields: FieldDef[];
  /** "side": form card left + table right (reference Slider/FAQ/Reasons); "modal": create button + dialog. */
  layout?: "side" | "modal" | "stacked";
  filters?: { key: string; label: string; options: { value: string | number; label: string }[] }[];
  defaults?: Record<string, any>;
  reorderable?: boolean;
  activeToggle?: boolean;
  readOnly?: boolean;
  noEdit?: boolean;
  createLabel?: string;
  headerActions?: React.ReactNode;
  subtitle?: string;
  /** Map row → form values for editing. */
  toForm?: (row: any) => Record<string, any>;
  /** Transform form values before submit. */
  beforeSubmit?: (values: Record<string, any>) => Record<string, any>;
  extraActions?: (row: any, reload: () => void) => React.ReactNode;
  note?: React.ReactNode;
}

export function CrudPage(cfg: CrudConfig) {
  const { toast, confirm } = useUi();
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useMemo(() => (cfg.reorderable ? { all: 1, q, ...filters } : { page, per_page: per, q, ...filters }), [cfg.reorderable, page, per, q, filters]);
  const list = useFetch<any[]>(`/admin/crud/${cfg.resource}`, query);

  const blank = useMemo(() => ({ ...(cfg.defaults ?? {}) }), [cfg.defaults]);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(cfg.layout === "side");
  const [values, setValues] = useState<Record<string, any>>(blank);
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState("en");
  const [saving, setSaving] = useState(false);
  const translatable = cfg.fields.some((f) => f.translatable);

  useEffect(() => setPage(1), [q, filters, per]);

  const startCreate = () => {
    setEditing(null);
    setValues(blank);
    setFiles({});
    setErrors({});
    setLang("en");
    setOpen(true);
  };
  const startEdit = (row: any) => {
    setEditing(row);
    setValues(cfg.toForm ? cfg.toForm(row) : { ...row });
    setFiles({});
    setErrors({});
    setLang("en");
    setOpen(true);
    if (cfg.layout === "side") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload: Record<string, any> = {};
      for (const f of cfg.fields) if (f.type !== "file" && f.type !== "files" && values[f.name] !== undefined) payload[f.name] = values[f.name] === "" ? null : values[f.name];
      if (translatable) payload.translations = values.translations ?? {};
      const body = cfg.beforeSubmit ? cfg.beforeSubmit(payload) : payload;
      const hasFiles = Object.values(files).some((f) => f.length);
      const path = editing ? `/admin/crud/${cfg.resource}/${editing.id}` : `/admin/crud/${cfg.resource}`;
      const method = editing ? "PUT" : "POST";
      if (hasFiles) {
        const form = toForm(body);
        for (const [k, fs] of Object.entries(files)) fs.forEach((f) => form.append(cfg.fields.find((x) => x.name === k)?.type === "files" ? `${k}[]` : k, f));
        await api(path, { method, form });
      } else await api(path, { method, body });
      toast(editing ? `${cfg.singular} updated.` : `${cfg.singular} created.`);
      if (cfg.layout === "side") startCreate();
      else setOpen(false);
      await list.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(err.errors ?? {}).map(([k, v]) => [k, v[0]])));
        toast(err.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    if (!(await confirm({ message: `Delete this ${cfg.singular.toLowerCase()}? This cannot be undone.` }))) return;
    try {
      await api(`/admin/crud/${cfg.resource}/${row.id}`, { method: "DELETE" });
      toast(`${cfg.singular} deleted.`);
      await list.reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed.", "error");
    }
  };

  const toggleActive = async (row: any, v: boolean) => {
    list.setData((rows) => rows?.map((r) => (r.id === row.id ? { ...r, is_active: v } : r)) ?? null);
    try {
      await put(`/admin/crud/${cfg.resource}/${row.id}`, { is_active: v });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed.", "error");
      void list.reload();
    }
  };

  const reorder = async (ids: (string | number)[]) => {
    try {
      await api(`/admin/crud/${cfg.resource}/reorder`, { method: "POST", body: { ids } });
      toast("Order saved.");
    } catch {
      toast("Could not save order.", "error");
    }
  };

  const columns: Column<any>[] = [
    ...cfg.columns,
    ...(cfg.activeToggle ? [{ key: "is_active", label: "Active", align: "center" as const, render: (r: any) => <Toggle checked={r.is_active !== false} onChange={(v) => void toggleActive(r, v)} /> }] : []),
    ...(!cfg.readOnly
      ? [
          {
            key: "actions",
            label: "Action",
            render: (r: any) => (
              <div className="flex gap-1.5">
                {cfg.extraActions?.(r, list.reload)}
                {!cfg.noEdit && <IconBtn icon="edit" title="Edit" onClick={() => startEdit(r)} />}
                <IconBtn icon="trash" title="Delete" tone="danger" onClick={() => void remove(r)} />
              </div>
            ),
          },
        ]
      : cfg.extraActions
        ? [{ key: "actions", label: "Action", render: (r: any) => <div className="flex gap-1.5">{cfg.extraActions!(r, list.reload)}</div> }]
        : []),
  ];

  const form = (
    <form onSubmit={submit}>
      {translatable && <LangTabs value={lang} onChange={setLang} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {cfg.fields
          .filter((f) => lang === "en" || f.translatable)
          .map((f) => (
            <FormField
              key={f.name}
              def={cfg.layout === "side" ? { ...f, span: 2 } : f}
              values={values}
              setValue={(n, v) => setValues((s) => ({ ...s, [n]: v }))}
              files={files}
              setFile={(n, fs) => setFiles((s) => ({ ...s, [n]: fs }))}
              errors={errors}
              lang={lang}
              row={editing}
            />
          ))}
      </div>
      {cfg.layout === "side" && (
        <div className="mt-5 flex justify-end gap-2">
          {editing && (
            <Button type="button" variant="outline" onClick={startCreate}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={saving}>
            {editing ? "Update" : "Submit"}
          </Button>
        </div>
      )}
    </form>
  );

  const table = (
    <DataTable
      columns={columns}
      rows={list.data}
      loading={list.loading}
      error={list.error}
      pagination={cfg.reorderable ? null : list.meta?.pagination}
      onPage={setPage}
      perPage={per}
      onPerPage={setPer}
      search={search}
      onSearch={setSearch}
      onRefresh={() => void list.reload()}
      exportName={cfg.resource}
      onReorder={cfg.reorderable ? reorder : undefined}
      toolbar={
        cfg.filters?.length ? (
          <div className="flex flex-wrap gap-3">
            {cfg.filters.map((f) => (
              <label key={f.key} className="block min-w-48">
                <span className="label">{f.label}</span>
                <Select value={filters[f.key] ?? ""} onChange={(e) => setFilters((s) => ({ ...s, [f.key]: e.target.value }))} options={f.options} placeholder="All" />
              </label>
            ))}
          </div>
        ) : undefined
      }
    />
  );

  return (
    <div>
      <PageHeader
        title={cfg.title}
        subtitle={cfg.subtitle}
        actions={
          <>
            {cfg.headerActions}
            {!cfg.readOnly && cfg.layout !== "side" && (
              <Button icon="plus" onClick={startCreate}>
                {cfg.createLabel ?? `Create ${cfg.singular}`}
              </Button>
            )}
          </>
        }
      />
      {cfg.layout === "side" && !cfg.readOnly ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,2fr)_3fr]">
          <Card title={editing ? `Edit ${cfg.singular}` : `Add ${cfg.singular}`} className="self-start">
            {form}
          </Card>
          <Card>
            {cfg.note && <p className="mb-3 text-sm text-danger">{cfg.note}</p>}
            {table}
          </Card>
        </div>
      ) : (
        <Card>
          {cfg.note && <p className="mb-3 text-sm text-danger">{cfg.note}</p>}
          {table}
        </Card>
      )}
      {cfg.layout !== "side" && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={editing ? `Edit ${cfg.singular}` : `Create ${cfg.singular}`}
          size={cfg.fields.some((f) => f.type === "categories" || f.type === "richtext") ? "lg" : "md"}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={() => void submit()}>
                {editing ? "Update" : "Save"}
              </Button>
            </>
          }
        >
          {form}
        </Modal>
      )}
    </div>
  );
}

export const activeCol = (label = "Status") => ({ key: "is_active", label, align: "center" as const, render: (r: any) => <span className={cx("font-semibold", r.is_active === false ? "text-muted" : "text-success")}>{r.is_active === false ? "Inactive" : "Active"}</span> });
