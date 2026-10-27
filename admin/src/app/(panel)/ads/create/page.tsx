"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { LocationSelect } from "@/components/location-select";
import { Button, Card, cx, Field, FileInput, Input, PageHeader, Select, Spinner, Textarea, useUi } from "@/components/ui";
import { api, ApiError, del, post, toForm } from "@/lib/api";
import { useFetch, useQueryParam } from "@/lib/hooks";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), { ssr: false });

type Step = "categories" | "details" | "media" | "address" | "seo";
const STEPS: { key: Step; label: string }[] = [
  { key: "categories", label: "Categories" },
  { key: "details", label: "Listing Details" },
  { key: "media", label: "Media" },
  { key: "address", label: "Address" },
  { key: "seo", label: "SEO" },
];

export default function CreateAd() {
  const editId = useQueryParam("id");
  const adType = useQueryParam("type");
  const { toast } = useUi();
  const cats = useFetch<any[]>("/admin/crud/categories", { all: 1 });
  const existing = useFetch<any>(editId ? `/ads/${editId}` : null);
  const [step, setStep] = useState<Step>("categories");
  const [path, setPath] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const fields = useFetch<any[]>(categoryId ? `/categories/${categoryId}/custom-fields` : null);
  const [v, setV] = useState<Record<string, any>>({ price_type: "fixed", condition: "used", currency_code: "USD" });
  const [cf, setCf] = useState<Record<string, any>>({});
  const [images, setImages] = useState<File[]>([]);
  const [seo, setSeo] = useState({ title: "", description: "", keywords: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const currencies = useFetch<any[]>("/currencies");

  useEffect(() => {
    const a = existing.data;
    if (!a) return;
    setCategoryId(a.category?.id ?? null);
    setV({
      title: a.title,
      description: a.description,
      price: a.price != null ? a.price / 100 : "",
      price_type: a.price_type ?? "fixed",
      condition: a.condition ?? "",
      currency_code: a.currency_code ?? "USD",
      phone: a.phone ?? "",
      video_url: a.video_url ?? "",
      address: a.location?.address ?? "",
      country_id: a.location?.country_id ?? "",
      state_id: a.location?.state_id ?? "",
      city_id: a.location?.city_id ?? "",
      latitude: a.location?.latitude ?? "",
      longitude: a.location?.longitude ?? "",
    });
    setCf(Object.fromEntries((a.custom_fields ?? []).map((f: any) => [f.code, f.value])));
    setStep("details");
  }, [existing.data]);

  const list = cats.data ?? [];
  const parent = path[path.length - 1] ?? null;
  const level = list.filter((c) => (c.parent_id ?? null) === parent && c.is_active !== false);
  const hasKids = (id: number) => list.some((c) => c.parent_id === id);
  const catName = useMemo(() => {
    const out: string[] = [];
    let c = list.find((x) => x.id === categoryId);
    while (c) {
      out.unshift(c.name);
      const pid = c.parent_id;
      c = list.find((x) => x.id === pid);
    }
    return out.join(" › ");
  }, [list, categoryId]);

  const pick = (c: any) => {
    if (hasKids(c.id)) setPath([...path, c.id]);
    else {
      setCategoryId(c.id);
      setCf({});
      setStep("details");
    }
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    const body: Record<string, any> = {
      category_id: categoryId,
      title: v.title,
      description: v.description,
      price: v.price_type === "free" || v.price_type === "contact" ? null : v.price,
      price_type: v.price_type,
      condition: v.condition || null,
      currency_code: v.currency_code,
      phone: v.phone || null,
      video_url: v.video_url || null,
      country_id: v.country_id || null,
      state_id: v.state_id || null,
      city_id: v.city_id || null,
      address: v.address || null,
      latitude: v.latitude === "" ? null : v.latitude,
      longitude: v.longitude === "" ? null : v.longitude,
      custom_fields: cf,
    };
    try {
      const form = toForm(body);
      images.forEach((f) => form.append("images[]", f));
      const r = editId ? await api(`/ads/${editId}`, { method: "PUT", form }) : await api("/ads", { method: "POST", form });
      if (seo.title || seo.description) await post("/admin/crud/seo_meta", { seoable_type: "ad", seoable_id: r.data.id, ...seo }).catch(() => undefined);
      if (!editId && r.data.status !== "approved") await post(`/admin/ads/${r.data.id}/approve`).catch(() => undefined);
      toast(editId ? "Advertisement updated." : "Advertisement created.");
      window.location.href = `/ads/view?id=${r.data.id}`;
    } catch (e) {
      if (e instanceof ApiError) {
        const errs = Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, x]) => [k.replace(/^custom_fields\./, "cf."), x[0]]));
        setErrors(errs);
        toast(e.message, "error");
        if (errs.title || errs.description || Object.keys(errs).some((k) => k.startsWith("cf."))) setStep("details");
      }
    } finally {
      setSaving(false);
    }
  };

  if (editId && existing.loading) return <div className="py-20 text-center text-brand"><Spinner size={32} /></div>;
  const idx = STEPS.findIndex((s) => s.key === step);

  return (
    <div>
      <PageHeader title={editId ? "Edit Advertisement" : `Create ${adType === "video" ? "Video " : ""}Advertisement`} back={{ href: "/ads", label: "Back to Ads" }} />
      <Card>
        <div className="mb-6 inline-flex flex-wrap rounded-lg bg-page p-1">
          {STEPS.map((s, i) => (
            <button key={s.key} type="button" disabled={!categoryId && i > 0} onClick={() => setStep(s.key)} className={cx("rounded-md px-4 py-2 text-[15px] transition disabled:opacity-40", step === s.key ? "bg-white font-semibold text-brand shadow-sm" : "text-muted hover:text-ink")}>
              {s.label}
            </button>
          ))}
        </div>

        {step === "categories" && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg">
              <button className="font-semibold hover:text-brand" onClick={() => setPath([])}>
                All Category
              </button>
              {path.map((id, i) => (
                <span key={id} className="flex items-center gap-2">
                  <Icon name="chevronRight" size={16} className="text-muted" />
                  <button className="hover:text-brand" onClick={() => setPath(path.slice(0, i + 1))}>
                    {list.find((c) => c.id === id)?.name}
                  </button>
                </span>
              ))}
            </div>
            {cats.loading && !cats.data ? (
              <Spinner />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {level.map((c) => (
                  <button key={c.id} type="button" onClick={() => pick(c)} className={cx("flex items-center gap-4 rounded-xl border p-4 text-left transition hover:border-brand hover:shadow-sm", categoryId === c.id ? "border-brand bg-brand-50/40" : "border-line")}>
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand">
                      {c.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.icon_url} alt="" className="h-9 w-9 object-contain" />
                      ) : (
                        <Icon name="tag" size={22} />
                      )}
                    </span>
                    <span className="flex-1">{c.name}</span>
                    {hasKids(c.id) && <Icon name="chevronRight" size={18} className="text-muted" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Category: <span className="font-semibold text-ink">{catName}</span>{" "}
              <button className="ml-2 text-brand underline" onClick={() => setStep("categories")}>
                change
              </button>
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" required error={errors.title} className="md:col-span-2">
                <Input value={v.title ?? ""} onChange={(e) => setV({ ...v, title: e.target.value })} />
              </Field>
              <Field label="Description" required error={errors.description} className="md:col-span-2">
                <Textarea rows={6} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} />
              </Field>
              <Field label="Price Type">
                <Select value={v.price_type} onChange={(e) => setV({ ...v, price_type: e.target.value })} options={["fixed", "negotiable", "free", "contact"].map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }))} />
              </Field>
              {!["free", "contact"].includes(v.price_type) && (
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <Field label="Currency">
                    <Select value={v.currency_code} onChange={(e) => setV({ ...v, currency_code: e.target.value })} options={(currencies.data ?? [{ code: "USD" }]).map((c: any) => ({ value: c.code, label: c.code }))} />
                  </Field>
                  <Field label="Price" error={errors.price}>
                    <Input type="number" min={0} step="any" value={v.price ?? ""} onChange={(e) => setV({ ...v, price: e.target.value })} />
                  </Field>
                </div>
              )}
              <Field label="Condition">
                <Select value={v.condition ?? ""} onChange={(e) => setV({ ...v, condition: e.target.value })} options={["new", "used", "refurbished"].map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }))} placeholder="Not applicable" />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <Input value={v.phone ?? ""} onChange={(e) => setV({ ...v, phone: e.target.value })} />
              </Field>
              {(adType === "video" || v.video_url) && (
                <Field label="Video URL" error={errors.video_url} className="md:col-span-2" hint="YouTube / short-video link">
                  <Input value={v.video_url ?? ""} onChange={(e) => setV({ ...v, video_url: e.target.value })} placeholder="https://" />
                </Field>
              )}
            </div>
            {(fields.data ?? []).length > 0 && (
              <div>
                <h3 className="mb-3 mt-2 font-semibold">Category details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {(fields.data ?? []).map((f) => (
                    <Field key={f.id} label={f.name} required={f.is_required} error={errors[`cf.${f.code}`]}>
                      {["dropdown", "radio"].includes(f.type) ? (
                        <Select value={cf[f.code] ?? ""} onChange={(e) => setCf({ ...cf, [f.code]: e.target.value })} options={(f.options ?? []).map((o: any) => ({ value: o.value, label: o.label }))} placeholder="Select" />
                      ) : f.type === "checkbox" ? (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {(f.options ?? []).map((o: any) => {
                            const cur: string[] = Array.isArray(cf[f.code]) ? cf[f.code] : [];
                            return (
                              <label key={o.value} className="flex items-center gap-1.5 text-sm">
                                <input type="checkbox" className="accent-[#272757]" checked={cur.includes(o.value)} onChange={() => setCf({ ...cf, [f.code]: cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value] })} />
                                {o.label}
                              </label>
                            );
                          })}
                        </div>
                      ) : f.type === "textarea" ? (
                        <Textarea value={cf[f.code] ?? ""} onChange={(e) => setCf({ ...cf, [f.code]: e.target.value })} />
                      ) : (
                        <Input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={cf[f.code] ?? ""} onChange={(e) => setCf({ ...cf, [f.code]: e.target.value })} />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep("media")}>Next</Button>
            </div>
          </div>
        )}

        {step === "media" && (
          <div className="space-y-4">
            {existing.data?.images?.length > 0 && (
              <div>
                <p className="label">Current images</p>
                <div className="flex flex-wrap gap-3">
                  {existing.data.images.map((i: any) => (
                    <div key={i.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.url} alt="" className={cx("h-24 w-28 rounded-lg object-cover", i.is_primary && "ring-2 ring-accent")} />
                      <button
                        type="button"
                        title="Delete image"
                        onClick={async () => {
                          await del(`/ads/${editId}/images/${i.id}`);
                          await existing.reload();
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white"
                      >
                        <Icon name="x" size={12} />
                      </button>
                      {!i.is_primary && (
                        <button
                          type="button"
                          onClick={async () => {
                            await post(`/ads/${editId}/images/${i.id}/primary`);
                            await existing.reload();
                          }}
                          className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 text-[11px] font-semibold text-brand"
                        >
                          Set primary
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Field label="Upload images" error={errors.images} hint="JPG, PNG or WebP · up to 5 MB each · first image becomes the cover">
              <FileInput multiple onChange={setImages} preview={images.map((f) => URL.createObjectURL(f))} />
            </Field>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button onClick={() => setStep("address")}>Next</Button>
            </div>
          </div>
        )}

        {step === "address" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <LocationSelect value={v} onChange={(l) => setV({ ...v, ...l })} errors={errors} />
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <Field label="Address" error={errors.address}>
                <Input value={v.address ?? ""} onChange={(e) => setV({ ...v, address: e.target.value })} />
              </Field>
              <Field label="Latitude" error={errors.latitude}>
                <Input type="number" step="any" value={v.latitude ?? ""} onChange={(e) => setV({ ...v, latitude: e.target.value })} />
              </Field>
              <Field label="Longitude" error={errors.longitude}>
                <Input type="number" step="any" value={v.longitude ?? ""} onChange={(e) => setV({ ...v, longitude: e.target.value })} />
              </Field>
            </div>
            <MapPicker lat={v.latitude === "" ? null : Number(v.latitude)} lng={v.longitude === "" ? null : Number(v.longitude)} onChange={(lat, lng) => setV((s) => ({ ...s, latitude: lat, longitude: lng }))} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("media")}>
                Back
              </Button>
              <Button onClick={() => setStep("seo")}>Next</Button>
            </div>
          </div>
        )}

        {step === "seo" && (
          <div className="space-y-4">
            <Field label="Meta Title">
              <Input value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            </Field>
            <Field label="Meta Description">
              <Textarea value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
            </Field>
            <Field label="Meta Keywords">
              <Input value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} placeholder="comma, separated" />
            </Field>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("address")}>
                Back
              </Button>
              <Button loading={saving} icon="check" onClick={() => void save()}>
                {editId ? "Update Advertisement" : "Publish Advertisement"}
              </Button>
            </div>
          </div>
        )}
        {idx > 0 && idx < 4 && Object.keys(errors).length > 0 && <p className="mt-4 text-sm text-danger">Please fix the highlighted fields.</p>}
      </Card>
    </div>
  );
}
