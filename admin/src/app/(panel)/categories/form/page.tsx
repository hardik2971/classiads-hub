"use client";

import { useEffect, useState } from "react";
import { CategorySelect, LangTabs } from "@/components/form-fields";
import { Button, Card, Field, FileInput, Input, PageHeader, Spinner, Textarea, Toggle, useUi } from "@/components/ui";
import { api, ApiError, toForm } from "@/lib/api";
import { useFetch, useQueryParam } from "@/lib/hooks";

export default function CategoryForm() {
  const id = useQueryParam("id");
  const parentParam = useQueryParam("parent_id");
  const { toast } = useUi();
  const row = useFetch<any>(id ? `/admin/crud/categories/${id}` : null);
  const [v, setV] = useState<Record<string, any>>({ is_active: true, sort_order: 0 });
  const [lang, setLang] = useState("en");
  const [icon, setIcon] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row.data) setV({ ...row.data });
  }, [row.data]);
  useEffect(() => {
    if (parentParam && !id) setV((s) => ({ ...s, parent_id: Number(parentParam) }));
  }, [parentParam, id]);

  const tr = (k: string) => (lang === "en" ? v[k] ?? "" : v.translations?.[lang]?.[k] ?? "");
  const setTr = (k: string, val: string) => (lang === "en" ? setV({ ...v, [k]: val }) : setV({ ...v, translations: { ...(v.translations ?? {}), [lang]: { ...(v.translations?.[lang] ?? {}), [k]: val } } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const form = toForm({ name: v.name, slug: v.slug ?? "", parent_id: v.parent_id || null, description: v.description ?? "", sort_order: v.sort_order ?? 0, is_active: v.is_active !== false, translations: v.translations ?? {} });
      if (icon[0]) form.append("icon", icon[0]);
      await api(id ? `/admin/crud/categories/${id}` : "/admin/crud/categories", { method: id ? "PUT" : "POST", form });
      toast(id ? "Category updated." : "Category created.");
      window.location.href = "/categories";
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(err.errors ?? {}).map(([k, x]) => [k, x[0]])));
        toast(err.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (id && row.loading && !row.data) return <div className="py-20 text-center text-brand"><Spinner size={32} /></div>;

  return (
    <div>
      <PageHeader title={id ? "Edit Category" : "Add Category"} back={{ href: "/categories", label: "Back to All Categories" }} />
      <form onSubmit={save}>
        <Card className="max-w-4xl">
          <LangTabs value={lang} onChange={setLang} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Name (${lang.toUpperCase()})`} required={lang === "en"} error={errors.name}>
              <Input value={tr("name")} onChange={(e) => setTr("name", e.target.value)} />
            </Field>
            {lang === "en" && (
              <Field label="Slug" error={errors.slug} hint="Leave blank to generate from the name">
                <Input value={v.slug ?? ""} onChange={(e) => setV({ ...v, slug: e.target.value })} />
              </Field>
            )}
            <Field label={`Description (${lang.toUpperCase()})`} className="sm:col-span-2">
              <Textarea value={tr("description")} onChange={(e) => setTr("description", e.target.value)} />
            </Field>
            {lang === "en" && (
              <>
                <Field label="Parent Category" hint="Leave empty for a main category">
                  <CategorySelect value={v.parent_id ?? ""} onChange={(x) => setV({ ...v, parent_id: x })} placeholder="— Main category —" exclude={id ? Number(id) : undefined} />
                </Field>
                <Field label="Sort order">
                  <Input type="number" value={v.sort_order ?? 0} onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })} />
                </Field>
                <Field label="Icon" error={errors.icon}>
                  <FileInput onChange={setIcon} preview={icon[0] ? URL.createObjectURL(icon[0]) : v.icon_url} hint="(use 256 x 256 size for better view)" />
                </Field>
                <div className="flex items-end pb-2">
                  <Toggle checked={v.is_active !== false} onChange={(x) => setV({ ...v, is_active: x })} label="Active" />
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              {id ? "Update" : "Save"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
