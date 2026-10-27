"use client";

import { useMemo, useState } from "react";
import { useFetch } from "@/lib/hooks";
import { Icon } from "./icon";
import { RichText } from "./rich-text";
import { cx, Field, FileInput, Input, Select, Textarea, Toggle } from "./ui";

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "select" | "toggle" | "file" | "files" | "tags" | "list" | "categories" | "category" | "richtext" | "date" | "options" | "permissions";

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  span?: 1 | 2;
  translatable?: boolean;
  showIf?: (v: Record<string, any>) => boolean;
  /** URL key in the row holding an existing upload preview (e.g. image_url). */
  previewKey?: string;
}

// ---------- languages ----------

export function useLanguages() {
  const { data } = useFetch<{ code: string; name: string; is_default: boolean }[]>("/languages");
  return useMemo(() => {
    const list = data ?? [{ code: "en", name: "English", is_default: true }];
    return [...list].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  }, [data]);
}

export function LangTabs({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const langs = useLanguages();
  if (langs.length < 2) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-x-1 border-b border-line">
      {langs.map((l) => (
        <button key={l.code} type="button" onClick={() => onChange(l.code)} className={cx("-mb-px rounded-t-lg border-b-2 px-4 py-2 text-[15px] transition", value === l.code ? "border-brand bg-brand-50 text-brand" : "border-transparent text-secondary hover:text-brand")}>
          {l.name}
        </button>
      ))}
    </div>
  );
}

// ---------- category tree (scope picker) ----------

interface Cat {
  id: number;
  name: string;
  parent_id: number | null;
}

export function CategoryTree({ value, onChange, single, withGlobal }: { value: number[]; onChange: (ids: number[]) => void; single?: boolean; withGlobal?: boolean }) {
  const { data } = useFetch<Cat[]>("/admin/crud/categories", { all: 1 });
  const [open, setOpen] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const cats = data ?? [];
  const children = (pid: number | null) => cats.filter((c) => (c.parent_id ?? null) === pid);
  const matches = (c: Cat): boolean => !q || c.name.toLowerCase().includes(q.toLowerCase()) || children(c.id).some(matches);
  const toggle = (id: number) => onChange(single ? [id] : value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const node = (c: Cat, depth: number): React.ReactNode => {
    if (!matches(c)) return null;
    const kids = children(c.id);
    const expanded = open.includes(c.id) || !!q;
    return (
      <div key={c.id}>
        <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 22 }}>
          <button type="button" className={cx("w-5 text-muted", !kids.length && "invisible")} onClick={() => setOpen((o) => (o.includes(c.id) ? o.filter((x) => x !== c.id) : [...o, c.id]))}>
            <Icon name={expanded ? "chevronDown" : "chevronRight"} size={16} />
          </button>
          <input type={single ? "radio" : "checkbox"} checked={value.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-[#272757]" />
          <Icon name={kids.length ? "folder" : "tag"} size={17} className="text-secondary" />
          <span className="text-[15px]">{c.name}</span>
        </div>
        {expanded && kids.map((k) => node(k, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="relative mb-3">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search something..." className="input pl-9" />
      </div>
      <div className="max-h-96 overflow-y-auto pr-1">
        {withGlobal && (
          <label className="flex items-center gap-2 py-1.5 pl-7">
            <input type="checkbox" checked={value.length === 0} onChange={() => onChange([])} className="h-4 w-4 accent-[#272757]" />
            <Icon name="globe" size={17} className="text-secondary" />
            <span className="text-[15px]">Global (Apply to All Categories)</span>
          </label>
        )}
        {children(null).map((c) => node(c, 0))}
      </div>
    </div>
  );
}

export function CategorySelect({ value, onChange, placeholder = "Select Category", leafOnly, exclude }: { value: number | ""; onChange: (id: number | "") => void; placeholder?: string; leafOnly?: boolean; /** Hide this category and its subtree (parent picker). */ exclude?: number }) {
  const { data } = useFetch<Cat[]>("/admin/crud/categories", { all: 1 });
  const cats = data ?? [];
  const opts: { value: number; label: string }[] = [];
  const walk = (pid: number | null, depth: number) => {
    for (const c of cats.filter((x) => (x.parent_id ?? null) === pid && x.id !== exclude)) {
      const hasKids = cats.some((x) => x.parent_id === c.id);
      if (!leafOnly || !hasKids) opts.push({ value: c.id, label: `${"— ".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return <Select value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")} options={opts} placeholder={placeholder} />;
}

// ---------- tags / list inputs ----------

export function TagsInput({ value, onChange, placeholder = "Type and press Enter" }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setText("");
  };
  return (
    <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}>
            <Icon name="x" size={12} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent outline-none"
      />
    </div>
  );
}

export function ListInput({ value, onChange, placeholder = "Enter value", addLabel = "Add" }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input value={v} placeholder={placeholder} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-lg bg-danger px-3 text-white">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </div>
  );
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  ads: "Ads & Jobs",
  categories: "Categories",
  custom_fields: "Custom Fields",
  content: "Content Management",
  chat: "Chat Management",
  packages: "Packages",
  transactions: "Transactions",
  sellers: "Seller Management",
  blogs: "Forms & Blogs",
  customers: "Customers",
  roles: "Roles",
  staff: "Staff",
  locations: "Locations",
  reports: "Reports",
  notifications: "Notifications",
  settings: "Settings",
};

export function PermissionsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(MODULE_LABELS).map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#272757]" checked={value.includes(k)} onChange={() => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k])} />
          {label}
        </label>
      ))}
    </div>
  );
}

// ---------- generic renderer ----------

export function FormField({ def, values, setValue, files, setFile, errors, lang, row }: {
  def: FieldDef;
  values: Record<string, any>;
  setValue: (name: string, v: any) => void;
  files: Record<string, File[]>;
  setFile: (name: string, f: File[]) => void;
  errors: Record<string, string>;
  lang: string;
  row?: Record<string, any> | null;
}) {
  if (def.showIf && !def.showIf(values)) return null;
  const translated = def.translatable && lang !== "en";
  const v = translated ? values.translations?.[lang]?.[def.name] ?? "" : values[def.name];
  const set = (val: any) => (translated ? setValue("translations", { ...(values.translations ?? {}), [lang]: { ...(values.translations?.[lang] ?? {}), [def.name]: val } }) : setValue(def.name, val));
  const label = def.translatable ? `${def.label} (${lang.toUpperCase()})` : def.label;
  const t = def.type ?? "text";
  const span = def.span === 2 ? "sm:col-span-2" : "";

  let control: React.ReactNode;
  switch (t) {
    case "textarea":
      control = <Textarea value={v ?? ""} placeholder={def.placeholder} onChange={(e) => set(e.target.value)} />;
      break;
    case "richtext":
      control = <RichText value={v ?? ""} onChange={set} />;
      break;
    case "select":
      control = <Select value={v ?? ""} onChange={(e) => set(e.target.value)} options={def.options ?? []} placeholder={def.placeholder ?? "Select"} />;
      break;
    case "toggle":
      return (
        <div className={cx("flex items-end pb-2", span)}>
          <Toggle checked={!!v} onChange={set} label={def.label} />
        </div>
      );
    case "file":
    case "files":
      control = <FileInput multiple={t === "files"} onChange={(f) => setFile(def.name, f)} preview={files[def.name]?.length ? files[def.name].map((f) => URL.createObjectURL(f)) : def.previewKey ? row?.[def.previewKey] : null} hint={def.hint} />;
      break;
    case "tags":
      control = <TagsInput value={Array.isArray(v) ? v : []} onChange={set} placeholder={def.placeholder} />;
      break;
    case "list":
      control = <ListInput value={Array.isArray(v) ? v : []} onChange={set} placeholder={def.placeholder} />;
      break;
    case "options":
      control = <ListInput value={Array.isArray(v) ? v.map((o: any) => (typeof o === "string" ? o : o.label)) : []} onChange={set} placeholder="Option value" addLabel="Add option" />;
      break;
    case "categories":
      control = <CategoryTree value={Array.isArray(v) ? v : []} onChange={set} />;
      break;
    case "category":
      control = <CategorySelect value={v ?? ""} onChange={set} />;
      break;
    case "permissions":
      control = <PermissionsInput value={Array.isArray(v) ? v : []} onChange={set} />;
      break;
    default:
      control = <Input type={t === "number" ? "number" : t === "email" ? "email" : t === "password" ? "password" : t === "date" ? "date" : "text"} step={t === "number" ? "any" : undefined} value={v ?? ""} placeholder={def.placeholder} onChange={(e) => set(e.target.value)} />;
  }
  return (
    <Field label={label} required={def.required && !translated} error={errors[def.name]} hint={t === "file" || t === "files" ? undefined : def.hint} className={span}>
      {control}
    </Field>
  );
}
