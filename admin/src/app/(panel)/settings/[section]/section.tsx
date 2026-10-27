"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudPage } from "@/components/crud-page";
import { DataTable } from "@/components/data-table";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/rich-text";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Spinner, Textarea, Toggle, useUi } from "@/components/ui";
import { api, ApiError, get, post, put } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useFetch } from "@/lib/hooks";
import { SECTIONS, SettingField, SettingSection } from "@/lib/settings-config";

const back = { href: "/settings", label: "Back to Settings" };

export function SettingsSection({ slug }: { slug: string }) {
  const s = SECTIONS.find((x) => x.slug === slug);
  if (!s) return <p>Unknown settings section.</p>;
  if (s.kind === "fields") return <FieldsSection section={s} />;
  if (s.kind === "page") return <PageEditor section={s} />;
  switch (slug) {
    case "dummy-data":
      return <DummyData />;
    case "firebase":
      return <FirebaseInfo />;
    case "languages":
      return <Languages />;
    case "payment-gateways":
      return <Gateways />;
    case "system-status":
      return <SystemStatus />;
    case "seo":
      return <Seo />;
    case "file-manager":
      return <FileManager />;
    case "email-templates":
      return <EmailTemplates />;
    case "currency":
      return <DefaultCurrency />;
    case "logs":
      return <Logs />;
  }
  return null;
}

// ---------- generic key/value settings ----------

function FieldsSection({ section }: { section: SettingSection }) {
  const { toast } = useUi();
  const { data, loading } = useFetch<Record<string, Record<string, any>>>("/admin/settings");
  const langs = useFetch<any[]>("/languages");
  const [v, setV] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setV(JSON.parse(JSON.stringify(data)));
  }, [data]);

  const fields = section.blocks!.flatMap((b) => b.fields);
  const val = (f: SettingField) => v[f.group]?.[f.key];
  const set = (f: SettingField, x: any) => setV((s) => ({ ...s, [f.group]: { ...(s[f.group] ?? {}), [f.key]: x } }));

  const save = async () => {
    setSaving(true);
    try {
      const groups = [...new Set(fields.map((f) => f.group))];
      for (const g of groups) {
        const gf = fields.filter((f) => f.group === g);
        const settings = Object.fromEntries(gf.map((f) => [f.key, f.type === "number" ? (val(f) === "" || val(f) == null ? null : Number(val(f))) : f.type === "toggle" ? !!val(f) : (val(f) ?? "")]));
        await put("/admin/settings", { group: g, settings, secret: gf.filter((f) => f.secret).map((f) => f.key) });
      }
      toast("Settings saved.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const control = (f: SettingField) => {
    if (f.key === "default_language")
      return <Select value={val(f) ?? "en"} onChange={(e) => set(f, e.target.value)} options={(langs.data ?? []).map((l) => ({ value: l.code, label: l.name }))} />;
    switch (f.type) {
      case "toggle":
        return <Toggle checked={!!val(f)} onChange={(x) => set(f, x)} />;
      case "textarea":
        return <Textarea value={val(f) ?? ""} onChange={(e) => set(f, e.target.value)} rows={3} />;
      case "select":
        return <Select value={val(f) ?? ""} onChange={(e) => set(f, e.target.value)} options={f.options ?? []} />;
      case "color":
        return (
          <div className="flex gap-2">
            <input type="color" value={val(f) || "#272757"} onChange={(e) => set(f, e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-line" />
            <Input value={val(f) ?? ""} onChange={(e) => set(f, e.target.value)} placeholder="#272757" />
          </div>
        );
      default:
        return <Input type={f.type === "number" ? "number" : f.type === "password" ? "password" : "text"} value={val(f) ?? ""} onChange={(e) => set(f, e.target.value)} autoComplete="off" />;
    }
  };

  if (loading && !data) return <div className="py-20 text-center text-brand"><Spinner size={32} /></div>;
  return (
    <div>
      <PageHeader title={section.title === "Settings" ? "System Settings" : section.title} subtitle={section.subtitle} back={back} actions={<Button loading={saving} icon="check" onClick={() => void save()}>Save</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        {section.blocks!.map((b, i) => (
          <Card key={b.title} className={section.blocks!.length === 3 && i === 2 ? "xl:col-span-2" : ""}>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[15px] font-semibold">{b.title}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {b.fields.map((f) => (
                <Field key={`${f.group}.${f.key}`} label={f.label} hint={f.hint} className={f.span === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  {control(f)}
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- CMS pages ----------

function PageEditor({ section }: { section: SettingSection }) {
  const { toast } = useUi();
  const pages = useFetch<any[]>("/admin/crud/pages", { all: 1 });
  const page = useMemo(() => pages.data?.find((p) => p.key === section.pageKey), [pages.data, section.pageKey]);
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setBody(page.body ?? "");
    }
  }, [page]);

  const save = async () => {
    setSaving(true);
    try {
      if (page) await put(`/admin/crud/pages/${page.id}`, { title, body, is_published: true });
      else await post("/admin/crud/pages", { key: section.pageKey, title, body, is_published: true });
      toast("Page saved.");
      await pages.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={section.title} subtitle={`Shown on the website at /page/${section.pageKey} and in the apps`} back={back} actions={<Button loading={saving} icon="check" onClick={() => void save()}>Save</Button>} />
      <Card>
        {pages.loading && !pages.data ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Content">
              <RichText value={body} onChange={setBody} minHeight={380} />
            </Field>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- custom sections ----------

function DummyData() {
  const { toast, confirm } = useUi();
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <PageHeader title="Dummy Data" back={back} />
      <Card className="max-w-2xl">
        <p className="text-sm text-muted">Demo advertisements imported during the migration are tagged as demo data. Remove them before going live.</p>
        <Button
          variant="danger"
          icon="trash"
          className="mt-5"
          loading={busy}
          onClick={async () => {
            if (!(await confirm({ message: "Delete all demo advertisements? This cannot be undone.", confirmLabel: "Remove demo data" }))) return;
            setBusy(true);
            const r = await post("/admin/dummy-data/remove");
            setBusy(false);
            toast(`${r.data.removed} demo ads removed.`);
          }}
        >
          Remove demo data
        </Button>
      </Card>
    </div>
  );
}

function FirebaseInfo() {
  const { toast } = useUi();
  const [vapid, setVapid] = useState("");
  useEffect(() => {
    void get("/admin/settings", { group: "firebase" }).then((r) => setVapid(r.data.firebase?.vapid_key ?? ""));
  }, []);
  const rows: [string, string][] = [
    ["Project ID", "classiadshub"],
    ["Auth domain", "classiadshub.firebaseapp.com"],
    ["Storage bucket", "classiadshub.firebasestorage.app"],
    ["Messaging sender ID", "76485180630"],
    ["Web app ID", "1:76485180630:web:0502a02da1fe5e6a465d77"],
    ["API base", "/api/v1 → Cloud Function `api` (us-central1)"],
  ];
  return (
    <div>
      <PageHeader title="Firebase Settings" subtitle="The whole backend runs on this Firebase project" back={back} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Project">
          <dl className="space-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                <dt className="text-muted">{k}</dt>
                <dd className="font-mono font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <a href="https://console.firebase.google.com/project/classiadshub/overview" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-brand underline">
            Open Firebase console <Icon name="arrowRight" size={14} />
          </a>
        </Card>
        <Card title="Web push">
          <Field label="VAPID key" hint="Firebase console → Project settings → Cloud Messaging → Web Push certificates">
            <Input value={vapid} onChange={(e) => setVapid(e.target.value)} />
          </Field>
          <Button className="mt-4" onClick={async () => { await put("/admin/settings", { group: "firebase", settings: { vapid_key: vapid } }); toast("Saved."); }}>
            Save
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Languages() {
  const [open, setOpen] = useState<any | null>(null);
  return (
    <>
      <PageHeader title="Languages" back={back} />
      <CrudPage
        title=""
        resource="languages"
        singular="Language"
        activeToggle
        columns={[
          { key: "name", label: "Name", sortable: true, render: (r) => <span className="flex items-center gap-2">{r.name}{r.is_default && <Badge tone="accent">Default</Badge>}</span> },
          { key: "code", label: "Code" },
          { key: "is_rtl", label: "RTL", render: (r) => (r.is_rtl ? "Yes" : "No") },
        ]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "code", label: "Code", required: true, placeholder: "en" },
          { name: "is_rtl", label: "Right-to-left", type: "toggle" },
          { name: "is_default", label: "Default language", type: "toggle" },
        ]}
        extraActions={(r) => (
          <button title="Translations" onClick={() => setOpen(r)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-[#f7f7fb] px-2 text-xs font-semibold hover:text-brand">
            <Icon name="language" size={14} /> Strings
          </button>
        )}
        defaults={{ is_active: true }}
      />
      {open && <Translations lang={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Translations({ lang, onClose }: { lang: any; onClose: () => void }) {
  const { toast } = useUi();
  const base = useFetch<Record<string, string>>("/admin/translations/en");
  const mine = useFetch<Record<string, string>>(`/admin/translations/${lang.code}`);
  const [v, setV] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [q, setQ] = useState("");
  // The whole map is saved back (PUT replaces it), so nothing may be edited/saved before the existing
  // strings are loaded — otherwise saving would wipe them. Keys typed meanwhile are merged on top.
  const ready = mine.data !== null && !mine.error;
  useEffect(() => {
    if (mine.data) setV((cur) => ({ ...mine.data, ...cur }));
  }, [mine.data]);
  const keys = [...new Set([...Object.keys(base.data ?? {}), ...Object.keys(v)])].filter((k) => k.toLowerCase().includes(q.toLowerCase())).sort();
  return (
    <Modal
      open
      onClose={onClose}
      title={`Translations — ${lang.name}`}
      size="xl"
      footer={
        <Button
          disabled={!ready}
          onClick={async () => {
            await put(`/admin/translations/${lang.code}`, { strings: v });
            toast("Translations saved.");
            onClose();
          }}
        >
          Save
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter keys…" className="max-w-xs" />
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="new.key" className="max-w-xs" />
        <Button variant="outline" icon="plus" disabled={!ready} onClick={() => { if (newKey) { setV((cur) => ({ ...cur, [newKey]: cur[newKey] ?? "" })); setNewKey(""); } }}>
          Add key
        </Button>
      </div>
      {!ready && <p className="py-6 text-center text-sm text-muted">{mine.error ?? "Loading strings…"}</p>}
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr] sm:items-center">
            <code className="truncate text-xs text-secondary">{k}</code>
            <span className="truncate text-sm text-muted">{base.data?.[k] ?? ""}</span>
            <Input value={v[k] ?? ""} disabled={!ready} onChange={(e) => setV((cur) => ({ ...cur, [k]: e.target.value }))} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Gateways() {
  const { toast } = useUi();
  const list = useFetch<any[]>("/admin/payment-gateways");
  const [edit, setEdit] = useState<any | null>(null);
  const [cfg, setCfg] = useState("");
  const save = async (g: any, patch: Record<string, unknown>) => {
    try {
      await put(`/admin/payment-gateways/${g.id}`, patch);
      toast("Gateway updated.");
      await list.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Update failed.", "error");
    }
  };
  return (
    <div>
      <PageHeader title="Payment Gateways" subtitle="Sandbox and Bank Transfer are built in; other providers need live credentials" back={back} />
      <Card>
        <DataTable
          rows={list.data}
          loading={list.loading}
          columns={[
            { key: "name", label: "Gateway", render: (r) => <span className="font-semibold">{r.name}</span> },
            { key: "code", label: "Code", render: (r) => <code className="text-xs">{r.code}</code> },
            { key: "is_manual", label: "Type", render: (r) => <Badge tone={r.is_manual ? "accent" : "soft"}>{r.is_manual ? "Manual" : "Online"}</Badge> },
            { key: "mode", label: "Mode", render: (r) => <Select value={r.mode ?? "sandbox"} onChange={(e) => void save(r, { mode: e.target.value })} options={[{ value: "sandbox", label: "Sandbox" }, { value: "live", label: "Live" }]} className="w-32 py-1.5" /> },
            { key: "is_active", label: "Enabled", align: "center", render: (r) => <Toggle checked={!!r.is_active} onChange={(x) => void save(r, { is_active: x })} /> },
            { key: "actions", label: "Credentials", render: (r) => <Button size="sm" variant="outline" icon="key" onClick={() => { setEdit(r); setCfg(JSON.stringify(r.config ?? {}, null, 2)); }}>Configure</Button> },
          ]}
        />
      </Card>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`${edit?.name ?? ""} configuration`}
        footer={
          <Button
            onClick={async () => {
              try {
                await save(edit, { config: JSON.parse(cfg || "{}") });
                setEdit(null);
              } catch {
                toast("Configuration must be valid JSON.", "error");
              }
            }}
          >
            Save
          </Button>
        }
      >
        <p className="mb-2 text-sm text-muted">{edit?.code === "bank_transfer" ? 'Set "instructions" and "bank_details" shown to customers.' : 'JSON object of provider keys, e.g. { "key_id": "...", "key_secret": "..." }'}</p>
        <Textarea rows={10} className="font-mono text-xs" value={cfg} onChange={(e) => setCfg(e.target.value)} />
      </Modal>
    </div>
  );
}

function SystemStatus() {
  const { data, loading, reload } = useFetch<any>("/admin/system-status");
  return (
    <div>
      <PageHeader title="System Status" back={back} actions={<Button variant="outline" icon="refresh" onClick={() => void reload()}>Re-check</Button>} />
      {loading && !data ? (
        <Spinner />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Services">
            <ul className="space-y-3">
              {Object.entries(data?.checks ?? {}).map(([k, c]: [string, any]) => (
                <li key={k} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                  <span className="flex items-center gap-3 font-semibold capitalize">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.ok ? "bg-success" : "bg-danger"}`} />
                    Firebase {k}
                  </span>
                  <Badge tone={c.ok ? "success" : "danger"}>{c.ok ? "Operational" : c.detail ?? "Error"}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Data">
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(data?.counts ?? {}).map(([k, n]) => (
                <div key={k} className="rounded-xl bg-page px-4 py-3">
                  <dt className="text-sm capitalize text-muted">{k.replace(/_/g, " ")}</dt>
                  <dd className="text-2xl font-semibold">{String(n)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted">
              Runtime {data?.runtime?.node} · region {data?.runtime?.region}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Seo() {
  return (
    <>
      <PageHeader title="Seo-Settings" subtitle="Meta tags per page route (home, search, blog…) or per item" back={back} />
      <CrudPage
        title=""
        resource="seo_meta"
        singular="SEO entry"
        columns={[
          { key: "route_key", label: "Route", render: (r) => r.route_key ?? `${r.seoable_type} #${r.seoable_id}` },
          { key: "title", label: "Meta title" },
          { key: "description", label: "Meta description", render: (r) => <span className="line-clamp-2 max-w-md">{r.description ?? "-"}</span> },
        ]}
        fields={[
          { name: "route_key", label: "Route key", placeholder: "home", hint: "home, search, blog, jobs, packages…" },
          { name: "title", label: "Meta title" },
          { name: "description", label: "Meta description", type: "textarea", span: 2 },
          { name: "keywords", label: "Keywords", span: 2 },
          { name: "og_image", label: "OG image URL", span: 2 },
        ]}
      />
    </>
  );
}

function FileManager() {
  const { toast, confirm } = useUi();
  const [prefix, setPrefix] = useState("");
  const { data, loading, reload } = useFetch<any>("/admin/files", { prefix });
  const crumbs = prefix.split("/").filter(Boolean);
  return (
    <div>
      <PageHeader title="File Manager" subtitle="Firebase Storage · classiadshub.firebasestorage.app" back={back} />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
          <button className="font-semibold text-brand" onClick={() => setPrefix("")}>
            storage
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              /
              <button className="text-brand" onClick={() => setPrefix(`${crumbs.slice(0, i + 1).join("/")}/`)}>
                {c}
              </button>
            </span>
          ))}
        </div>
        {loading && !data ? (
          <Spinner />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {(data?.folders ?? []).map((f: string) => (
              <button key={f} onClick={() => setPrefix(f)} className="flex flex-col items-center gap-2 rounded-xl border border-line p-4 hover:border-brand">
                <Icon name="folder" size={36} className="text-accent" />
                <span className="truncate text-sm">{f.replace(prefix, "").replace(/\/$/, "")}</span>
              </button>
            ))}
            {(data?.files ?? []).map((f: any) => (
              <div key={f.path} className="group relative overflow-hidden rounded-xl border border-line">
                {f.url && f.content_type?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="h-28 w-full object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-page text-muted">
                    <Icon name={f.url ? "file" : "lock"} size={30} />
                  </div>
                )}
                <div className="p-2 text-xs">
                  <p className="truncate font-medium">{f.name}</p>
                  <p className="text-muted">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="absolute right-2 top-2 hidden rounded-full bg-danger p-1.5 text-white group-hover:block"
                  title="Delete"
                  onClick={async () => {
                    if (await confirm({ message: `Delete ${f.path}? Anything referencing it will show a broken image.` })) {
                      await api(`/admin/files?path=${encodeURIComponent(f.path)}`, { method: "DELETE" });
                      toast("File deleted.");
                      await reload();
                    }
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            {!(data?.folders ?? []).length && !(data?.files ?? []).length && <p className="col-span-full py-8 text-center text-sm text-muted">This folder is empty.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmailTemplates() {
  return (
    <>
      <PageHeader title="Email Templates" back={back} />
      <CrudPage
        title=""
        resource="email_templates"
        singular="Template"
        activeToggle
        columns={[
          { key: "code", label: "Code", sortable: true, render: (r) => <code className="text-xs">{r.code}</code> },
          { key: "subject", label: "Subject" },
        ]}
        fields={[
          { name: "code", label: "Code", required: true, placeholder: "welcome" },
          { name: "subject", label: "Subject", required: true },
          { name: "body_html", label: "Body", type: "richtext", required: true, span: 2 },
          { name: "variables", label: "Variables", type: "tags", span: 2, hint: "Placeholders available in this template, e.g. name, link" },
        ]}
        defaults={{ is_active: true, variables: [] }}
      />
    </>
  );
}

function DefaultCurrency() {
  const { toast } = useUi();
  const currencies = useFetch<any[]>("/admin/crud/currencies", { all: 1 });
  const [cur, setCur] = useState("");
  useEffect(() => {
    void get("/admin/settings", { group: "general" }).then((r) => setCur(r.data.general?.default_currency ?? "USD"));
  }, []);
  return (
    <div>
      <PageHeader title="Default Currency Settings" back={back} />
      <Card className="max-w-xl">
        <Field label="Default currency" hint="Used for new ads, packages and price display">
          <Select value={cur} onChange={(e) => setCur(e.target.value)} options={(currencies.data ?? []).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))} />
        </Field>
        <Button
          className="mt-4"
          onClick={async () => {
            await put("/admin/settings", { group: "general", settings: { default_currency: cur } });
            const def = currencies.data?.find((c) => c.code === cur);
            if (def) await put(`/admin/crud/currencies/${def.id}`, { is_default: true });
            toast("Default currency saved.");
          }}
        >
          Save
        </Button>
      </Card>
    </div>
  );
}

function Logs() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, reload } = useFetch<any[]>("/admin/audit-logs", { page, per_page: 30 });
  return (
    <div>
      <PageHeader title="Log Viewer" subtitle="Admin actions recorded by the API" back={back} />
      <Card>
        <DataTable
          rows={data}
          loading={loading}
          pagination={meta?.pagination}
          onPage={setPage}
          onRefresh={() => void reload()}
          exportName="audit-log"
          columns={[
            { key: "created_at", label: "Time", render: (r) => fmtDateTime(r.created_at) },
            { key: "user", label: "User", render: (r) => r.user?.name ?? "System" },
            { key: "action", label: "Action", render: (r) => <code className="text-xs">{r.action}</code> },
            { key: "subject", label: "Subject", render: (r) => (r.subject_type ? `${r.subject_type} #${r.subject_id}` : "-") },
            { key: "meta", label: "Details", render: (r) => <span className="line-clamp-2 max-w-md text-xs text-muted">{r.meta && Object.keys(r.meta).length ? JSON.stringify(r.meta) : "-"}</span> },
          ]}
        />
      </Card>
    </div>
  );
}


