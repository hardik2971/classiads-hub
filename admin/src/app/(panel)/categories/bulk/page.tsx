"use client";

import { useState } from "react";
import { Button, Card, Field, FileInput, PageHeader, useUi } from "@/components/ui";
import { ApiError, get, post } from "@/lib/api";
import { download } from "@/lib/format";

/** CSV columns: name, parent (name or slug, optional), sort_order (optional), is_active (1/0, optional). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const split = (l: string) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  const head = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
}

export default function BulkCategories() {
  const { toast } = useUi();
  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setLog([]);
    const rows = parseCsv(await file.text());
    const existing = (await get<any[]>("/admin/crud/categories", { all: 1 })).data;
    const find = (key: string) => existing.find((c) => c.name.toLowerCase() === key.toLowerCase() || c.slug === key);
    let ok = 0;
    for (const r of rows) {
      if (!r.name) continue;
      const parent = r.parent ? find(r.parent) : null;
      try {
        const created = await post("/admin/crud/categories", { name: r.name, parent_id: parent?.id ?? null, sort_order: Number(r.sort_order || 0), is_active: r.is_active !== "0" });
        existing.push(created.data);
        ok++;
        setLog((l) => [...l, `✔ ${r.name}`]);
      } catch (e) {
        setLog((l) => [...l, `✘ ${r.name}: ${e instanceof ApiError ? e.message : "failed"}`]);
      }
    }
    toast(`${ok} categories imported.`);
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title="Bulk Upload Categories" back={{ href: "/categories", label: "Back to All Categories" }} />
      <Card className="max-w-3xl">
        <p className="mb-4 text-sm text-muted">Upload a CSV with columns <code>name, parent, sort_order, is_active</code>. Parents are matched by name or slug and must appear before their children.</p>
        <Button variant="outline" icon="download" onClick={() => download("categories-sample.csv", "name,parent,sort_order,is_active\nElectronics,,0,1\nLaptops,Electronics,1,1\n")}>
          Download sample
        </Button>
        <Field label="CSV file" className="mt-4">
          <FileInput accept=".csv,text/csv" onChange={(f) => setFile(f[0] ?? null)} />
        </Field>
        <Button className="mt-4" loading={busy} disabled={!file} icon="upload" onClick={() => void run()}>
          Import
        </Button>
        {log.length > 0 && <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-page p-3 text-xs">{log.join("\n")}</pre>}
      </Card>
    </div>
  );
}
