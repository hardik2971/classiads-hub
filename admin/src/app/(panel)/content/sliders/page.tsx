"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { CategorySelect } from "@/components/form-fields";
import { LocationSelect } from "@/components/location-select";
import { Button, Card, Field, FileInput, IconBtn, Input, PageHeader, Select, Thumb, Toggle, useUi } from "@/components/ui";
import { api, ApiError, del, put, toForm } from "@/lib/api";
import { useFetch } from "@/lib/hooks";

export default function SlidersPage() {
  const { toast, confirm } = useUi();
  const list = useFetch<any[]>("/admin/crud/sliders", { all: 1 });
  const ads = useFetch<any[]>("/admin/ads", { status: "approved", per_page: 100 });
  const cats = useFetch<any[]>("/admin/crud/categories", { all: 1 });
  const countries = useFetch<any[]>("/locations/countries");
  const [v, setV] = useState<Record<string, any>>({});
  const [image, setImage] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image[0]) return setErrors({ image: "The image field is required." });
    setSaving(true);
    setErrors({});
    try {
      const link_type = v.ad_id ? "ad" : v.category_id ? "category" : v.external_url ? "external" : "none";
      const form = toForm({ ad_id: v.ad_id || null, category_id: v.category_id || null, external_url: v.external_url || null, title: v.title || null, link_type, country_id: v.country_id || null, state_id: v.state_id || null, city_id: v.city_id || null, is_active: true });
      form.append("image", image[0]);
      await api("/admin/crud/sliders", { method: "POST", form });
      toast("Slider created.");
      setV({});
      setImage([]);
      setFormKey((k) => k + 1);
      await list.reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(Object.fromEntries(Object.entries(err.errors ?? {}).map(([k, x]) => [k, x[0]])));
    } finally {
      setSaving(false);
    }
  };

  const name = (id: number, coll: any[] | null, key = "name") => coll?.find((x) => x.id === id)?.[key] ?? "-";

  return (
    <div>
      <PageHeader title="Slider" />
      <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <Card className="self-start">
          <form key={formKey} onSubmit={save} className="space-y-4">
            <Field label="Image" required error={errors.image}>
              <FileInput onChange={setImage} preview={image[0] ? URL.createObjectURL(image[0]) : null} hint="Recommended 1200 × 450" />
            </Field>
            <Field label="Title">
              <Input value={v.title ?? ""} onChange={(e) => setV({ ...v, title: e.target.value })} />
            </Field>
            <Field label="Item">
              <Select value={v.ad_id ?? ""} onChange={(e) => setV({ ...v, ad_id: e.target.value ? Number(e.target.value) : "", category_id: "", external_url: "" })} options={(ads.data ?? []).map((a) => ({ value: a.id, label: a.title }))} placeholder="Select Advertisement" />
            </Field>
            <p className="text-center text-sm font-semibold text-muted">OR</p>
            <Field label="Category">
              <CategorySelect value={v.category_id ?? ""} onChange={(x) => setV({ ...v, category_id: x, ad_id: "", external_url: "" })} />
            </Field>
            <p className="text-center text-sm font-semibold text-muted">OR</p>
            <Field label="Third Party Link" error={errors.external_url}>
              <Input value={v.external_url ?? ""} onChange={(e) => setV({ ...v, external_url: e.target.value, ad_id: "", category_id: "" })} placeholder="https://" />
            </Field>
            <LocationSelect value={v} onChange={(l) => setV({ ...v, ...l })} />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Submit
              </Button>
            </div>
          </form>
        </Card>
        <Card>
          <DataTable
            rows={list.data}
            loading={list.loading}
            onRefresh={() => void list.reload()}
            exportName="sliders"
            onReorder={async (ids) => {
              await api("/admin/crud/sliders/reorder", { method: "POST", body: { ids } });
              toast("Order saved.");
            }}
            columns={[
              { key: "image", label: "Image", render: (r) => <Thumb src={r.image_url} size={56} /> },
              { key: "link_type", label: "Type", render: (r) => (r.link_type === "ad" ? "Advertisement" : r.link_type === "category" ? "Category" : r.link_type === "external" ? "Link" : "-") },
              { key: "name", label: "Name", render: (r) => (r.ad_id ? name(r.ad_id, ads.data, "title") : r.category_id ? name(r.category_id, cats.data) : r.title ?? "-") },
              { key: "country", label: "Country", render: (r) => (r.country_id ? name(r.country_id, countries.data) : "-") },
              { key: "external_url", label: "Third Party Link", render: (r) => (r.external_url ? <a className="break-all text-brand underline" href={r.external_url} target="_blank" rel="noreferrer">{r.external_url}</a> : "-") },
              { key: "is_active", label: "Active", align: "center", render: (r) => <Toggle checked={r.is_active !== false} onChange={async (x) => { await put(`/admin/crud/sliders/${r.id}`, { is_active: x }); await list.reload(); }} /> },
              {
                key: "actions",
                label: "Action",
                render: (r) => (
                  <IconBtn
                    icon="trash"
                    title="Delete"
                    tone="danger"
                    onClick={async () => {
                      if (await confirm({ message: "Delete this slide?" })) {
                        await del(`/admin/crud/sliders/${r.id}`);
                        toast("Slider deleted.");
                        await list.reload();
                      }
                    }}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
