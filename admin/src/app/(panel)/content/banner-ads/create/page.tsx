"use client";

import { useEffect, useState } from "react";
import { CategorySelect } from "@/components/form-fields";
import { Icon } from "@/components/icon";
import { Button, Card, cx, Field, FileInput, Input, PageHeader, Select, useUi } from "@/components/ui";
import { api, ApiError, toForm } from "@/lib/api";
import { BANNER_PAGES } from "@/lib/constants";
import { useFetch, useQueryParam } from "@/lib/hooks";

const STEPS = ["Platform and Select Page", "Banner Layout", "Upload Banner", "Banner Placement"];

export default function CreateBanner() {
  const id = useQueryParam("id");
  const { toast } = useUi();
  const row = useFetch<any>(id ? `/admin/crud/banner_ads/${id}` : null);
  const ads = useFetch<any[]>("/admin/ads", { status: "approved", per_page: 100 });
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, any>>({ platform: "", page: "home", layout: "single", ad_type: "category" });
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (row.data) setV({ ...row.data });
  }, [row.data]);

  const need = v.layout === "dual" ? 2 : 1;
  const canNext = [!!v.platform && !!v.page, !!v.layout, files.length >= need || (!!id && (row.data?.image_paths ?? []).length >= need), true][step];

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const form = toForm({ platform: v.platform, page: v.page, layout: v.layout, ad_type: v.ad_type, category_id: v.ad_type === "category" ? v.category_id || null : null, ad_id: v.ad_type === "advertisement" ? v.ad_id || null : null, external_url: v.ad_type === "external" ? v.external_url || null : null, placement: v.placement || null, is_active: true });
      files.slice(0, need).forEach((f) => form.append("images[]", f));
      await api(id ? `/admin/crud/banner_ads/${id}` : "/admin/crud/banner_ads", { method: id ? "PUT" : "POST", form });
      toast(id ? "Banner updated." : "Banner created.");
      window.location.href = "/content/banner-ads";
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const Option = ({ on, onClick, icon, text }: { on: boolean; onClick: () => void; icon: string; text: string }) => (
    <button type="button" onClick={onClick} className={cx("flex items-center gap-3 rounded-xl border p-5 text-left transition", on ? "border-brand bg-brand-50/40" : "border-line hover:border-brand/40")}>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-page text-ink">
        <Icon name={icon} />
      </span>
      <span className="flex-1 text-[15px]">{text}</span>
      <span className={cx("h-5 w-5 rounded-full border-2", on ? "border-brand bg-brand shadow-[inset_0_0_0_3px_white]" : "border-line")} />
    </button>
  );

  return (
    <div>
      <PageHeader title={id ? "Edit Banner Ad" : "Create Banner Ads"} actions={<Button onClick={() => (window.location.href = "/content/banner-ads")}>Back</Button>} />
      <Card>
        <ol className="mb-8 flex flex-wrap items-center gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-3">
              <span className={cx("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold", i <= step ? "bg-brand text-white" : "bg-page text-muted")}>{i + 1}</span>
              <span className={cx("whitespace-nowrap text-[15px]", i === step ? "font-semibold text-brand" : "text-muted")}>{s}</span>
              {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="label">Select Platform <span className="text-danger">*</span></p>
              <div className="grid gap-4 md:grid-cols-2">
                <Option on={v.platform === "web"} onClick={() => setV({ ...v, platform: "web" })} icon="monitor" text="Website" />
                <Option on={v.platform === "app"} onClick={() => setV({ ...v, platform: "app" })} icon="mobile" text="App" />
              </div>
            </div>
            <Field label="Page" required>
              <Select value={v.page} onChange={(e) => setV({ ...v, page: e.target.value })} options={BANNER_PAGES} />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Option on={v.layout === "single"} onClick={() => setV({ ...v, layout: "single" })} icon="image" text="Single banner" />
            <Option on={v.layout === "dual"} onClick={() => setV({ ...v, layout: "dual" })} icon="columns" text="Dual banner (side by side)" />
          </div>
        )}
        {step === 2 && (
          <Field label={`Upload ${need} banner image${need > 1 ? "s" : ""}`} hint="Recommended 1200 × 300 (single) or 600 × 300 (dual)">
            <FileInput multiple={need > 1} onChange={setFiles} preview={files.length ? files.map((f) => URL.createObjectURL(f)) : row.data?.image_urls} />
          </Field>
        )}
        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ad Type" required>
              <Select value={v.ad_type} onChange={(e) => setV({ ...v, ad_type: e.target.value })} options={[{ value: "category", label: "Category" }, { value: "advertisement", label: "Advertisement" }, { value: "external", label: "External Link" }]} />
            </Field>
            {v.ad_type === "category" && (
              <Field label="Category">
                <CategorySelect value={v.category_id ?? ""} onChange={(x) => setV({ ...v, category_id: x })} />
              </Field>
            )}
            {v.ad_type === "advertisement" && (
              <Field label="Advertisement">
                <Select value={v.ad_id ?? ""} onChange={(e) => setV({ ...v, ad_id: e.target.value })} options={(ads.data ?? []).map((a) => ({ value: a.id, label: a.title }))} placeholder="Select advertisement" />
              </Field>
            )}
            {v.ad_type === "external" && (
              <Field label="External URL">
                <Input value={v.external_url ?? ""} onChange={(e) => setV({ ...v, external_url: e.target.value })} placeholder="https://" />
              </Field>
            )}
            <Field label="Placement" hint="e.g. top, middle, bottom">
              <Input value={v.placement ?? ""} onChange={(e) => setV({ ...v, placement: e.target.value })} />
            </Field>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button loading={saving} onClick={() => void save()}>
              {id ? "Update" : "Create"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
