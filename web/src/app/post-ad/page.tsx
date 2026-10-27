"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { clientApi } from "@/lib/api.client";
import { useAuth } from "@/context/auth-context";
import type { Category, CustomField } from "@/lib/types";
import { Container } from "@/components/ui/misc";
import { Button, Spinner } from "@/components/ui/button";
import { Field, inputClass } from "@/components/auth/auth-shell";
import { CustomFieldInput } from "@/components/ad/custom-field-input";

interface Country { id: number; name: string }
interface Place { id: number; name: string }

function flatten(cats: Category[], depth = 0): { id: number; label: string }[] {
  const out: { id: number; label: string }[] = [];
  for (const c of cats) {
    out.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
    if (c.children?.length) out.push(...flatten(c.children, depth + 1));
  }
  return out;
}

export default function PostAdPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [cats, setCats] = useState<{ id: number; label: string }[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<Place[]>([]);
  const [cities, setCities] = useState<Place[]>([]);

  const [form, setForm] = useState<Record<string, string>>({ price_type: "fixed" });
  const [cf, setCf] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login?next=/post-ad");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    clientApi<Category[]>("/categories/tree").then((r) => setCats(flatten(r.data))).catch(() => {});
    clientApi<Country[]>("/locations/countries").then((r) => setCountries(r.data)).catch(() => {});
  }, []);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onCategory(id: string) {
    set("category_id", id);
    setCf({});
    if (!id) return setFields([]);
    try {
      const r = await clientApi<CustomField[]>(`/categories/${id}/custom-fields`);
      setFields(r.data);
    } catch {
      setFields([]);
    }
  }

  async function onCountry(id: string) {
    set("country_id", id);
    set("state_id", "");
    set("city_id", "");
    setStates([]);
    setCities([]);
    if (id) {
      const r = await clientApi<Place[]>("/locations/states", { query: { country_id: id } });
      setStates(r.data);
    }
  }

  async function onState(id: string) {
    set("state_id", id);
    set("city_id", "");
    if (id) {
      const r = await clientApi<Place[]>("/locations/cities", { query: { state_id: id } });
      setCities(r.data);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        category_id: Number(form.category_id),
        title: form.title,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        price_type: form.price_type,
        condition: form.condition || undefined,
        phone: form.phone || undefined,
        country_id: form.country_id ? Number(form.country_id) : undefined,
        state_id: form.state_id ? Number(form.state_id) : undefined,
        city_id: form.city_id ? Number(form.city_id) : undefined,
        custom_fields: cf,
      };
      const res = await clientApi<{ id: number }>("/ads", { method: "POST", body });
      const adId = res.data.id;

      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("images[]", f));
        try {
          await clientApi(`/ads/${adId}/images`, { method: "POST", formData: fd });
        } catch {
          // The ad exists already (re-submitting would duplicate it); add photos from the edit page.
          router.push(`/dashboard/ads/${adId}/edit`);
          return;
        }
      }
      router.push("/dashboard/ads");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to post ad.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <Container className="py-16"><Spinner className="h-7 w-7 text-brand" /></Container>;

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="mb-1 text-2xl font-bold">Post an Ad</h1>
      <p className="mb-6 text-sm text-muted">Reach thousands of buyers in minutes.</p>

      <form onSubmit={submit} className="space-y-5">
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">1. Category</h2>
          <Field label="Category">
            <select className={inputClass} value={form.category_id ?? ""} onChange={(e) => onCategory(e.target.value)} required>
              <option value="">Select a category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">2. Details</h2>
          <Field label="Title"><input className={inputClass} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} required /></Field>
          <Field label="Description">
            <textarea className={`${inputClass} h-28 py-2`} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price"><input className={inputClass} type="number" step="0.01" value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label="Price type">
              <select className={inputClass} value={form.price_type} onChange={(e) => set("price_type", e.target.value)}>
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free</option>
                <option value="contact">Contact for price</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Condition">
              <select className={inputClass} value={form.condition ?? ""} onChange={(e) => set("condition", e.target.value)}>
                <option value="">—</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </Field>
            <Field label="Phone"><input className={inputClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          </div>
        </section>

        {fields.length > 0 && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">3. Extra Details</h2>
            {fields.map((f) => (
              <CustomFieldInput key={f.code} field={f} value={cf[f.code] ?? ""} onChange={(v) => setCf((s) => ({ ...s, [f.code]: v }))} />
            ))}
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">4. Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Country">
              <select className={inputClass} value={form.country_id ?? ""} onChange={(e) => onCountry(e.target.value)}>
                <option value="">—</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="State">
              <select className={inputClass} value={form.state_id ?? ""} onChange={(e) => onState(e.target.value)} disabled={!states.length}>
                <option value="">—</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="City">
              <select className={inputClass} value={form.city_id ?? ""} onChange={(e) => set("city_id", e.target.value)} disabled={!cities.length}>
                <option value="">—</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">5. Images</h2>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} className="text-sm" />
          <p className="text-xs text-muted">Upload up to 10 photos. The first becomes the cover.</p>
        </section>

        <Button type="submit" size="lg" fullWidth loading={submitting}>Publish Ad</Button>
      </form>
    </Container>
  );
}
