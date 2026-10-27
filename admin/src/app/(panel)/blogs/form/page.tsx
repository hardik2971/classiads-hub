"use client";

import { useEffect, useState } from "react";
import { LangTabs, TagsInput } from "@/components/form-fields";
import { RichText } from "@/components/rich-text";
import { Button, Card, Field, FileInput, Input, PageHeader, Select, Spinner, Textarea, useUi } from "@/components/ui";
import { api, ApiError, post, toForm } from "@/lib/api";
import { useFetch, useQueryParam } from "@/lib/hooks";

const TR_KEYS = ["title", "body", "tags", "meta_title", "meta_description", "meta_keywords"];

export default function BlogForm() {
  const id = useQueryParam("id");
  const { toast } = useUi();
  const row = useFetch<any>(id ? `/admin/blog/${id}` : null);
  const cats = useFetch<any[]>("/admin/crud/blog_categories", { all: 1 });
  const [v, setV] = useState<Record<string, any>>({ status: "published", tags: [] });
  const [lang, setLang] = useState("en");
  const [cover, setCover] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState(false);

  useEffect(() => {
    if (row.data) setV({ ...row.data, tags: row.data.tags ?? [] });
  }, [row.data]);

  const get = (k: string) => (lang === "en" ? v[k] : v.translations?.[lang]?.[k]);
  const set = (k: string, val: any) => (lang === "en" || !TR_KEYS.includes(k) ? setV((s) => ({ ...s, [k]: val })) : setV((s) => ({ ...s, translations: { ...(s.translations ?? {}), [lang]: { ...(s.translations?.[lang] ?? {}), [k]: val } } })));

  const generate = async () => {
    if (!v.title) return toast("Enter a title first.", "error");
    setAi(true);
    try {
      const r = await post("/admin/ai/generate", { prompt: v.title, type: "blog" });
      // Markdown-ish draft → HTML blocks ("## x" headings, blank-line separated paragraphs).
      const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = String(r.data.content)
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => (b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b)}</p>`))
        .join("");
      set("body", `${get("body") ?? ""}${html}`);
    } finally {
      setAi(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const form = toForm({
        title: v.title,
        slug: v.slug ?? "",
        body: v.body ?? "",
        blog_category_id: v.blog_category_id || null,
        status: v.status,
        tags: v.tags ?? [],
        meta_title: v.meta_title ?? "",
        meta_description: v.meta_description ?? "",
        meta_keywords: v.meta_keywords ?? "",
        schema: v.schema ?? "",
        translations: v.translations ?? {},
      });
      if (cover[0]) form.append("cover_image", cover[0]);
      await api(id ? `/admin/blog/${id}` : "/admin/blog", { method: id ? "PUT" : "POST", form });
      toast(id ? "Blog updated." : "Blog created.");
      window.location.href = "/blogs";
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
  const L = lang === "en" ? "English" : lang.toUpperCase();

  return (
    <div>
      <PageHeader title={id ? "Edit Blog" : "Create Blogs"} back={{ href: "/blogs", label: "Back to Blogs" }} />
      <Card title={id ? "Edit Blog" : "Add Blog"}>
        <LangTabs value={lang} onChange={setLang} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={`Title (${L})`} required={lang === "en"} error={errors.title}>
            <Input value={get("title") ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          {lang === "en" ? (
            <Field label="Slug" error={errors.slug}>
              <Input value={v.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          ) : (
            <div />
          )}
          {lang === "en" && (
            <>
              <Field label="Image" required={!id} error={errors.cover_image}>
                <FileInput onChange={setCover} preview={cover[0] ? URL.createObjectURL(cover[0]) : v.cover_image} />
              </Field>
              <Field label="Category" required error={errors.blog_category_id}>
                <Select value={v.blog_category_id ?? ""} onChange={(e) => set("blog_category_id", e.target.value ? Number(e.target.value) : "")} options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} placeholder="Select Category" />
              </Field>
            </>
          )}
          <Field label={`Tags (${L})`} required={lang === "en"}>
            <TagsInput value={get("tags") ?? []} onChange={(t) => set("tags", t)} placeholder="Tags" />
          </Field>
          {lang === "en" && (
            <Field label="Status">
              <Select value={v.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }]} />
            </Field>
          )}
          <Field label={`Description (${L})`} required={lang === "en"} error={errors.body} className="md:col-span-2">
            <RichText value={get("body") ?? ""} onChange={(html) => set("body", html)} />
          </Field>
          {lang === "en" && (
            <div className="md:col-span-2">
              <Button variant="light" icon="robot" loading={ai} onClick={() => void generate()}>
                Generate draft with AI
              </Button>
            </div>
          )}
        </div>
        <div className="mt-6 rounded-xl border border-line">
          <h3 className="border-b border-line px-5 py-4 font-semibold">SEO Details ({L})</h3>
          <div className="space-y-4 p-5">
            <Field label={`Meta Title (${L})`}>
              <Input value={get("meta_title") ?? ""} onChange={(e) => set("meta_title", e.target.value)} />
            </Field>
            <Field label={`Meta Description (${L})`}>
              <Textarea value={get("meta_description") ?? ""} onChange={(e) => set("meta_description", e.target.value)} />
            </Field>
            <Field label={`Meta Keywords (${L})`}>
              <Input value={get("meta_keywords") ?? ""} onChange={(e) => set("meta_keywords", e.target.value)} placeholder="Enter keywords..." />
            </Field>
            {lang === "en" && (
              <Field label="Schema (JSON-LD)">
                <Textarea className="font-mono" value={v.schema ?? ""} onChange={(e) => set("schema", e.target.value)} placeholder={'{"@context": "https://schema.org", ...}'} />
              </Field>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button loading={saving} onClick={() => void save()}>
            {id ? "Update" : "Submit"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
