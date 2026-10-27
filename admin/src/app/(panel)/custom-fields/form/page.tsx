"use client";

import { useEffect, useState } from "react";
import { CategoryTree, LangTabs, ListInput } from "@/components/form-fields";
import { Button, Card, Field, FileInput, Input, PageHeader, Select, Spinner, Toggle, useUi } from "@/components/ui";
import { api, ApiError, toForm } from "@/lib/api";
import { useFetch, useQueryParam } from "@/lib/hooks";
import { FIELD_TYPES } from "@/lib/constants";

const WITH_OPTIONS = ["dropdown", "radio", "checkbox"];

export default function CustomFieldForm() {
  const id = useQueryParam("id");
  const { toast } = useUi();
  const row = useFetch<any>(id ? `/admin/crud/custom_fields/${id}` : null);
  const [v, setV] = useState<Record<string, any>>({ type: "number", is_required: false, is_active: true, options: [], category_ids: [] });
  const [lang, setLang] = useState("en");
  const [icon, setIcon] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row.data) setV({ ...row.data, options: (row.data.options ?? []).map((o: any) => o.label ?? o.value) });
  }, [row.data]);

  const name = lang === "en" ? v.name ?? "" : v.translations?.[lang]?.name ?? "";
  const setName = (val: string) => (lang === "en" ? setV({ ...v, name: val }) : setV({ ...v, translations: { ...(v.translations ?? {}), [lang]: { ...(v.translations?.[lang] ?? {}), name: val } } }));

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const form = toForm({
        name: v.name,
        type: v.type,
        min_length: v.min_length === "" ? null : v.min_length ?? null,
        max_length: v.max_length === "" ? null : v.max_length ?? null,
        is_required: !!v.is_required,
        is_active: v.is_active !== false,
        options: WITH_OPTIONS.includes(v.type) ? (v.options ?? []).filter((o: string) => o.trim()) : [],
        category_ids: v.category_ids ?? [],
        translations: v.translations ?? {},
      });
      if (icon[0]) form.append("icon", icon[0]);
      await api(id ? `/admin/crud/custom_fields/${id}` : "/admin/crud/custom_fields", { method: id ? "PUT" : "POST", form });
      toast(id ? "Custom field updated." : "Custom field created.");
      window.location.href = "/custom-fields";
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, x]) => [k, x[0]])));
        toast(e.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (id && row.loading && !row.data) return <div className="py-20 text-center text-brand"><Spinner size={32} /></div>;

  return (
    <div>
      <PageHeader title="Custom Fields" back={{ href: "/custom-fields", label: "Back to Custom Fields" }} actions={<Button loading={saving} onClick={() => void save()}>{id ? "Update" : "Save and Back"}</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={id ? "Edit Custom Field" : "Create Custom Field"} className="self-start">
          <LangTabs value={lang} onChange={setLang} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Field Name (${lang === "en" ? "English" : lang.toUpperCase()})`} required={lang === "en"} error={errors.name} className="sm:col-span-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            {lang === "en" && (
              <>
                <Field label="Field Type" className="sm:col-span-2" error={errors.type}>
                  <Select value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} options={FIELD_TYPES} />
                </Field>
                {["number", "textbox", "textarea"].includes(v.type) && (
                  <>
                    <Field label="Field Length (Min)">
                      <Input type="number" min={0} value={v.min_length ?? ""} onChange={(e) => setV({ ...v, min_length: e.target.value })} />
                    </Field>
                    <Field label="Field Length (Max)">
                      <Input type="number" min={0} value={v.max_length ?? ""} onChange={(e) => setV({ ...v, max_length: e.target.value })} />
                    </Field>
                  </>
                )}
                {WITH_OPTIONS.includes(v.type) && (
                  <Field label="Field Values" className="sm:col-span-2" error={errors.options}>
                    <ListInput value={v.options ?? []} onChange={(o) => setV({ ...v, options: o })} placeholder="Option" addLabel="Add value" />
                  </Field>
                )}
                <Field label="Icon" className="sm:col-span-2" error={errors.icon}>
                  <FileInput onChange={setIcon} preview={icon[0] ? URL.createObjectURL(icon[0]) : v.icon_url} hint="(use 256 x 256 size for better view)" />
                </Field>
                <Toggle checked={!!v.is_required} onChange={(x) => setV({ ...v, is_required: x })} label="Required" />
                <Toggle checked={v.is_active !== false} onChange={(x) => setV({ ...v, is_active: x })} label="Active" />
              </>
            )}
          </div>
        </Card>
        <Card title={<div><h2 className="text-lg font-semibold">Category Scope</h2><p className="text-sm text-muted">Select the categories where this Custom Field should be applied</p></div>}>
          <CategoryTree value={v.category_ids ?? []} onChange={(ids) => setV({ ...v, category_ids: ids })} />
        </Card>
      </div>
    </div>
  );
}
