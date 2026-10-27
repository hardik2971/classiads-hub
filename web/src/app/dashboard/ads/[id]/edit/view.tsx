"use client";

import { useRouter } from "next/navigation";
import { useRouteParam } from "@/lib/use-route-param";
import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import type { Ad, AdImage, CustomField } from "@/lib/types";
import { mediaUrl } from "@/lib/utils";
import { Button, Spinner } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Field, inputClass } from "@/components/auth/auth-shell";
import { CustomFieldInput } from "@/components/ad/custom-field-input";

export function EditAdView() {
  const router = useRouter();
  const idParam = useRouteParam(2);
  const id = Number(idParam);

  const [form, setForm] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<CustomField[]>([]);
  const [cf, setCf] = useState<Record<string, string>>({});
  const [images, setImages] = useState<AdImage[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    // The owner can read their own ad by id in any status (pending, sold, …).
    const ad = (await clientApi<Ad>(`/ads/${id}`)).data;
    setForm({
      title: ad.title,
      description: ad.description,
      price: ad.price != null ? String(ad.price / 100) : "",
      price_type: ad.price_type ?? "fixed",
      condition: ad.condition ?? "",
      phone: ad.phone ?? "",
    });
    setStatus(ad.status);
    setImages(ad.images ?? []);
    setCf(Object.fromEntries((ad.custom_fields ?? []).map((f) => [f.code, f.value == null ? "" : String(f.value)])));
    if (ad.category?.id) {
      const r = await clientApi<CustomField[]>(`/categories/${ad.category.id}/custom-fields`).catch(() => null);
      setFields(r?.data ?? []);
    }
  }, [id]);

  useEffect(() => {
    if (idParam === null) return;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    load()
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, idParam, load]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function removeImage(imageId: number) {
    try {
      await clientApi(`/ads/${id}/images/${imageId}`, { method: "DELETE" });
      setImages((list) => list.filter((i) => i.id !== imageId));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not delete image.");
    }
  }

  async function makePrimary(imageId: number) {
    try {
      await clientApi(`/ads/${id}/images/${imageId}/primary`, { method: "POST" });
      setImages((list) => list.map((i) => ({ ...i, is_primary: i.id === imageId })));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not update cover image.");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        price_type: form.price_type,
        condition: form.condition || null,
        phone: form.phone || null,
      };
      if (fields.length) body.custom_fields = cf;
      await clientApi(`/ads/${id}`, { method: "PUT", body });

      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("images[]", f));
        await clientApi(`/ads/${id}/images`, { method: "POST", formData: fd });
      }
      router.push("/dashboard/ads");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner className="h-7 w-7 text-brand" />;
  if (notFound) return <EmptyState title="Ad not found" subtitle="It may have been deleted." icon="📦" />;

  return (
    <div className="max-w-xl">
      <h1 className="mb-5 text-2xl font-bold">Edit Ad</h1>
      {status === "approved" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Saving changes may send the ad back for review before it is live again.
        </p>
      )}
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <Field label="Title"><input name="title" className={inputClass} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} required /></Field>
        <Field label="Description"><textarea name="description" className={`${inputClass} h-28 py-2`} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} required /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price"><input name="price" className={inputClass} type="number" step="0.01" value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Price type">
            <select name="price_type" className={inputClass} value={form.price_type ?? "fixed"} onChange={(e) => set("price_type", e.target.value)}>
              <option value="fixed">Fixed</option>
              <option value="negotiable">Negotiable</option>
              <option value="free">Free</option>
              <option value="contact">Contact for price</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Condition">
            <select name="condition" className={inputClass} value={form.condition ?? ""} onChange={(e) => set("condition", e.target.value)}>
              <option value="">—</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </Field>
          <Field label="Phone"><input name="phone" className={inputClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        </div>

        {fields.length > 0 && (
          <div className="space-y-4 border-t border-border pt-4">
            <h2 className="font-bold">Extra Details</h2>
            {fields.map((f) => (
              <CustomFieldInput key={f.code} field={f} value={cf[f.code] ?? ""} onChange={(v) => setCf((s) => ({ ...s, [f.code]: v }))} />
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-border pt-4">
          <h2 className="font-bold">Images</h2>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(img.url) ?? ""} alt="" className="h-24 w-full object-cover" />
                  <div className="flex items-center justify-between gap-1 p-1.5 text-xs">
                    {img.is_primary ? (
                      <span className="font-semibold text-brand">Cover</span>
                    ) : (
                      <button type="button" onClick={() => makePrimary(img.id)} className="text-muted hover:text-brand">Set cover</button>
                    )}
                    <button type="button" onClick={() => removeImage(img.id)} className="text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} className="text-sm" />
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Save changes</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
