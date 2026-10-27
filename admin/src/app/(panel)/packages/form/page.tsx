"use client";

import { useEffect, useState } from "react";
import { CategoryTree, LangTabs, ListInput } from "@/components/form-fields";
import { Button, Card, Field, FileInput, Input, PageHeader, Select, Spinner, Textarea, useUi } from "@/components/ui";
import { api, ApiError, toForm } from "@/lib/api";
import { useFetch, useQueryParam } from "@/lib/hooks";

export default function PackageForm() {
  const id = useQueryParam("id");
  const { toast } = useUi();
  const row = useFetch<any>(id ? `/admin/crud/packages/${id}` : null);
  const currencies = useFetch<any[]>("/currencies");
  const [v, setV] = useState<Record<string, any>>({ type: "ad_listing", status: "active", currency_code: "USD", discount_percent: 0, unlimited_duration: false, is_unlimited: false, key_points: [], category_ids: [] });
  const [lang, setLang] = useState("en");
  const [icon, setIcon] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row.data) setV({ ...row.data, price: (row.data.price ?? 0) / 100, unlimited_duration: !row.data.duration_days, key_points: row.data.key_points ?? [], category_ids: row.data.category_ids ?? [] });
  }, [row.data]);

  const finalPrice = Math.max(0, Number(v.price || 0) * (1 - Number(v.discount_percent || 0) / 100));
  const tr = (k: string) => (lang === "en" ? v[k] ?? "" : v.translations?.[lang]?.[k] ?? "");
  const setTr = (k: string, val: any) => (lang === "en" ? setV({ ...v, [k]: val }) : setV({ ...v, translations: { ...(v.translations ?? {}), [lang]: { ...(v.translations?.[lang] ?? {}), [k]: val } } }));

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const form = toForm({
        name: v.name,
        description: v.description ?? "",
        type: v.type,
        price: v.price ?? 0,
        discount_percent: Number(v.discount_percent || 0),
        currency_code: v.currency_code,
        duration_days: v.unlimited_duration ? null : v.duration_days || null,
        ad_limit: v.is_unlimited ? null : v.ad_limit || null,
        is_unlimited: !!v.is_unlimited,
        ios_product_id: v.ios_product_id || null,
        android_product_id: v.android_product_id || null,
        key_points: (v.key_points ?? []).filter((x: string) => x.trim()),
        status: v.status,
        category_ids: v.category_ids ?? [],
        translations: v.translations ?? {},
      });
      if (icon[0]) form.append("icon", icon[0]);
      await api(id ? `/admin/crud/packages/${id}` : "/admin/crud/packages", { method: id ? "PUT" : "POST", form });
      toast(id ? "Package updated." : "Package created.");
      window.location.href = "/packages";
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
  const cur = v.currency_code ?? "USD";

  return (
    <div>
      <PageHeader title={id ? "Edit Package" : "Create Package"} back={{ href: "/packages", label: "Back to Packages" }} actions={<Button loading={saving} onClick={() => void save()}>{id ? "Update Package" : "Create Package"}</Button>} />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card title={id ? "Edit Package" : "Create Package"} className="self-start">
          <LangTabs value={lang} onChange={setLang} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Package Name (${lang === "en" ? "English" : lang.toUpperCase()})`} required={lang === "en"} error={errors.name}>
              <Input value={tr("name")} onChange={(e) => setTr("name", e.target.value)} />
            </Field>
            {lang === "en" && (
              <Field label="IOS Product ID">
                <Input value={v.ios_product_id ?? ""} onChange={(e) => setV({ ...v, ios_product_id: e.target.value })} />
              </Field>
            )}
            <Field label={`Description (${lang.toUpperCase()})`} className="sm:col-span-2">
              <Textarea rows={3} value={tr("description")} onChange={(e) => setTr("description", e.target.value)} />
            </Field>
            {lang === "en" && (
              <>
                <Field label="Android Product ID">
                  <Input value={v.android_product_id ?? ""} onChange={(e) => setV({ ...v, android_product_id: e.target.value })} />
                </Field>
                <Field label="Currency">
                  <Select value={cur} onChange={(e) => setV({ ...v, currency_code: e.target.value })} options={(currencies.data ?? [{ code: "USD" }]).map((c: any) => ({ value: c.code, label: c.code }))} />
                </Field>
                <Field label={`Price (${cur})`} required error={errors.price}>
                  <Input type="number" min={0} step="any" value={v.price ?? ""} onChange={(e) => setV({ ...v, price: e.target.value })} />
                </Field>
                <Field label="Discount (%)" required error={errors.discount_percent}>
                  <Input type="number" min={0} max={100} value={v.discount_percent ?? 0} onChange={(e) => setV({ ...v, discount_percent: e.target.value })} />
                </Field>
                <Field label={`Final Price (${cur})`} className="sm:col-span-2">
                  <Input readOnly value={finalPrice.toFixed(2)} />
                </Field>
                <Field label="Package Duration Type" required>
                  <div className="flex gap-6 pt-2">
                    {[false, true].map((u) => (
                      <label key={String(u)} className="flex items-center gap-2 text-[15px]">
                        <input type="radio" className="h-4 w-4 accent-[#272757]" checked={!!v.unlimited_duration === u} onChange={() => setV({ ...v, unlimited_duration: u })} />
                        {u ? "Unlimited" : "Limited"}
                      </label>
                    ))}
                  </div>
                </Field>
                {!v.unlimited_duration && (
                  <Field label="Duration (Days)" required error={errors.duration_days}>
                    <Input type="number" min={1} placeholder="Enter duration in days" value={v.duration_days ?? ""} onChange={(e) => setV({ ...v, duration_days: e.target.value })} />
                  </Field>
                )}
                <Field label="Package Type" required className="sm:col-span-2">
                  <div className="flex gap-8 pt-2">
                    {[
                      ["ad_listing", "Ad Listing Package"],
                      ["featured_ads", "Featured Ads Package"],
                    ].map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 text-[15px]">
                        <input type="radio" className="h-4 w-4 accent-[#272757]" checked={v.type === val} onChange={() => setV({ ...v, type: val })} />
                        {label}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Ad Limit">
                  <div className="flex items-center gap-3">
                    <Input type="number" min={0} disabled={!!v.is_unlimited} value={v.ad_limit ?? ""} onChange={(e) => setV({ ...v, ad_limit: e.target.value })} />
                    <label className="flex shrink-0 items-center gap-2 text-sm">
                      <input type="checkbox" className="accent-[#272757]" checked={!!v.is_unlimited} onChange={(e) => setV({ ...v, is_unlimited: e.target.checked })} /> Unlimited
                    </label>
                  </div>
                </Field>
                <Field label="Status">
                  <Select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "discontinued", label: "Discontinued" }]} />
                </Field>
                <Field label="Icon" className="sm:col-span-2">
                  <FileInput onChange={setIcon} preview={icon[0] ? URL.createObjectURL(icon[0]) : v.icon_url} />
                </Field>
              </>
            )}
            <Field label={`Key Points (${lang === "en" ? "English" : lang.toUpperCase()})`} className="sm:col-span-2">
              <ListInput value={lang === "en" ? v.key_points ?? [] : v.translations?.[lang]?.key_points ?? []} onChange={(kp) => setTr("key_points", kp)} placeholder="Enter key point" addLabel="Add Key Point" />
            </Field>
          </div>
        </Card>
        <Card title={<div><h2 className="text-lg font-semibold">Category Scope</h2><p className="text-sm text-muted">Select the categories where this Package should be applied</p></div>} className="self-start">
          <CategoryTree withGlobal value={v.category_ids ?? []} onChange={(ids) => setV({ ...v, category_ids: ids })} />
        </Card>
      </div>
    </div>
  );
}
