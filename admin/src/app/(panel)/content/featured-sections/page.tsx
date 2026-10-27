"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { CategoryTree, LangTabs } from "@/components/form-fields";
import { Badge, Button, Card, cx, Field, IconBtn, Input, PageHeader, Select, Toggle, useUi } from "@/components/ui";
import { api, ApiError, del, put } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

const FILTERS = [
  { value: "latest", label: "Latest Ads" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "most_liked", label: "Most Liked" },
  { value: "featured", label: "Featured Ads" },
  { value: "category", label: "Category Criteria" },
  { value: "price_low_high", label: "Price: Low → High" },
  { value: "price_high_low", label: "Price: High → Low" },
];

/** Card-style previews of the four app section layouts. */
function StylePreview({ style }: { style: string }) {
  const n = { style_1: 2, style_2: 3, style_3: 2, style_4: 2 }[style] ?? 2;
  return (
    <div className={cx("flex gap-1.5", style === "style_3" && "flex-col")}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={cx("rounded-md bg-white p-1 shadow-sm", style === "style_3" ? "flex h-9 gap-1.5" : "w-full")}>
          <div className={cx("rounded bg-gradient-to-br from-secondary/70 to-brand", style === "style_3" ? "h-full w-10" : "h-12")} />
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-8 rounded bg-accent" />
            <div className="h-1.5 w-12 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedSections() {
  const { toast, confirm } = useUi();
  const list = useFetch<any[]>("/admin/crud/featured_sections", { all: 1 });
  const blank = { filter_type: "latest", style: "style_1", item_limit: 10, category_ids: [] as number[] };
  const [v, setV] = useState<Record<string, any>>(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [lang, setLang] = useState("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const title = lang === "en" ? v.title ?? "" : v.translations?.[lang]?.title ?? "";
  const setTitle = (t: string) => (lang === "en" ? setV({ ...v, title: t }) : setV({ ...v, translations: { ...(v.translations ?? {}), [lang]: { title: t } } }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      const body = { title: v.title, slug: v.slug || null, filter_type: v.filter_type, style: v.style, item_limit: Number(v.item_limit) || 10, category_ids: v.filter_type === "category" ? v.category_ids : [], translations: v.translations ?? {}, is_active: v.is_active !== false };
      await api(editing ? `/admin/crud/featured_sections/${editing}` : "/admin/crud/featured_sections", { method: editing ? "PUT" : "POST", body });
      toast(editing ? "Section updated." : "Section created.");
      setV(blank);
      setEditing(null);
      await list.reload();
    } catch (e) {
      if (e instanceof ApiError) setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, x]) => [k, x[0]])));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={editing ? "Edit Feature Section" : "Create Feature Section"} />
      <Card title={editing ? "Edit Feature Section" : "Add Feature Section"}>
        <LangTabs value={lang} onChange={setLang} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={`Title (${lang === "en" ? "English" : lang.toUpperCase()})`} required={lang === "en"} error={errors.title} className="md:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          </Field>
          {lang === "en" && (
            <>
              <Field label="Slug" hint="Generated from the title when empty">
                <Input value={v.slug ?? ""} onChange={(e) => setV({ ...v, slug: e.target.value })} />
              </Field>
              <Field label="Filters" required error={errors.filter_type}>
                <Select value={v.filter_type} onChange={(e) => setV({ ...v, filter_type: e.target.value })} options={FILTERS} />
              </Field>
              <Field label="Items to show">
                <Input type="number" min={1} max={50} value={v.item_limit} onChange={(e) => setV({ ...v, item_limit: e.target.value })} />
              </Field>
              <div className="flex items-end pb-2">
                <Toggle checked={v.is_active !== false} onChange={(x) => setV({ ...v, is_active: x })} label="Active" />
              </div>
              {v.filter_type === "category" && (
                <Field label="Categories" className="md:col-span-2">
                  <div className="rounded-xl border border-line p-3">
                    <CategoryTree value={v.category_ids ?? []} onChange={(ids) => setV({ ...v, category_ids: ids })} />
                  </div>
                </Field>
              )}
              <Field label="Select Style for APP Section" required className="md:col-span-2">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {["style_1", "style_2", "style_3", "style_4"].map((s) => (
                    <button key={s} type="button" onClick={() => setV({ ...v, style: s })} className={cx("rounded-xl border-2 bg-page p-3 text-left transition", v.style === s ? "border-brand" : "border-transparent hover:border-brand/30")}>
                      <StylePreview style={s} />
                      <span className="mt-2 block text-xs font-semibold capitalize text-secondary">{s.replace("_", " ")}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); setV(blank); }}>
              Cancel
            </Button>
          )}
          <Button loading={saving} onClick={() => void submit()}>
            Submit
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <p className="mb-3 text-sm text-danger">* To change the order, drag the table rows up &amp; down</p>
        <DataTable
          rows={list.data}
          loading={list.loading}
          onRefresh={() => void list.reload()}
          exportName="featured-sections"
          onReorder={async (ids) => {
            await api("/admin/crud/featured_sections/reorder", { method: "POST", body: { ids } });
            toast("Order saved.");
          }}
          columns={[
            { key: "style", label: "Style", render: (r) => <div className="w-20 rounded-lg bg-page p-1.5"><StylePreview style={r.style ?? "style_1"} /></div> },
            { key: "title", label: "Title", sortable: true },
            { key: "filter_type", label: "Filters", render: (r) => <Badge tone="muted">{FILTERS.find((f) => f.value === r.filter_type)?.label ?? r.filter_type}</Badge> },
            { key: "sort_order", label: "Sequence", align: "center" },
            { key: "value", label: "Value", render: (r) => (r.filter_type === "category" ? <Badge tone="brand">{(r.category_ids ?? [r.category_id]).filter(Boolean).length} Category</Badge> : `${r.item_limit ?? 10} items`) },
            { key: "is_active", label: "Active", align: "center", render: (r) => <Toggle checked={r.is_active !== false} onChange={async (x) => { await put(`/admin/crud/featured_sections/${r.id}`, { is_active: x }); await list.reload(); }} /> },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" onClick={() => { setEditing(r.id); setV({ ...r, category_ids: r.category_ids ?? (r.category_id ? [r.category_id] : []) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: `Delete "${r.title}"?` })) { await del(`/admin/crud/featured_sections/${r.id}`); toast("Deleted."); await list.reload(); } }} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
