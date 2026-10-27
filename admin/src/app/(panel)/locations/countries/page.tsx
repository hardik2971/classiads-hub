"use client";

import { useState } from "react";
import { CrudPage } from "@/components/crud-page";
import { Button, Input, Modal, useUi } from "@/components/ui";
import { get, post } from "@/lib/api";

const flag = (iso2?: string) => (iso2 && iso2.length === 2 ? String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "");

interface RC {
  name: { common: string };
  cca2: string;
  cca3: string;
  idd?: { root?: string; suffixes?: string[] };
  currencies?: Record<string, unknown>;
}

/**
 * Country dataset (restcountries schema). restcountries.com/v3.1 was retired, so a pinned copy of the
 * world-countries package is used instead.
 */
const COUNTRIES_URL = "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";

/** Imports countries from the public world-countries dataset. */
function ImportCountries({ onDone }: { onDone: () => void }) {
  const { toast } = useUi();
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<RC[]>([]);
  const [have, setHave] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setOpen(true);
    try {
      const [list, mine] = await Promise.all([fetch(COUNTRIES_URL).then((r) => r.json() as Promise<RC[]>), get<any[]>("/admin/crud/countries", { all: 1 })]);
      if (!Array.isArray(list)) throw new Error("bad dataset");
      setAll(list.sort((a, b) => a.name.common.localeCompare(b.name.common)));
      setHave(new Set(mine.data.map((c) => (c.iso2 ?? "").toUpperCase())));
    } catch {
      toast("Could not load the country list. Try again later.", "error");
      setOpen(false);
    }
  };

  const run = async () => {
    setBusy(true);
    for (const code of pick) {
      const c = all.find((x) => x.cca2 === code)!;
      await post("/admin/crud/countries", {
        name: c.name.common,
        iso2: c.cca2,
        iso3: c.cca3,
        phone_code: c.idd?.root ? `${c.idd.root}${c.idd.suffixes?.length === 1 ? c.idd.suffixes[0] : ""}` : null,
        currency_code: Object.keys(c.currencies ?? {})[0] ?? null,
        flag_path: flag(c.cca2),
      }).catch(() => undefined);
    }
    toast(`${pick.length} countries imported.`);
    setBusy(false);
    setOpen(false);
    setPick([]);
    onDone();
  };

  const visible = all.filter((c) => !have.has(c.cca2) && c.name.common.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Button icon="plus" onClick={() => void load()}>
        Import Countries
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Import Countries" size="lg" footer={<Button loading={busy} disabled={!pick.length} onClick={() => void run()}>Import {pick.length || ""}</Button>}>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
        <div className="grid max-h-[50vh] gap-1 overflow-y-auto sm:grid-cols-2">
          {visible.map((c) => (
            <label key={c.cca2} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50">
              <input type="checkbox" className="accent-[#272757]" checked={pick.includes(c.cca2)} onChange={() => setPick((p) => (p.includes(c.cca2) ? p.filter((x) => x !== c.cca2) : [...p, c.cca2]))} />
              <span className="text-lg">{flag(c.cca2)}</span> {c.name.common}
            </label>
          ))}
          {!all.length && <p className="text-sm text-muted">Loading…</p>}
        </div>
      </Modal>
    </>
  );
}

export default function Countries() {
  const [key, setKey] = useState(0);
  return (
    <CrudPage
      key={key}
      title="Countries"
      resource="countries"
      singular="Country"
      activeToggle
      headerActions={<ImportCountries onDone={() => setKey((k) => k + 1)} />}
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "flag", label: "Flag", render: (r) => <span className="text-xl">{r.flag_path && !r.flag_path.startsWith("http") ? r.flag_path : flag(r.iso2)}</span> },
        { key: "iso2", label: "ISO", render: (r) => `${r.iso2 ?? ""} / ${r.iso3 ?? ""}` },
        { key: "phone_code", label: "Phone code" },
        { key: "currency_code", label: "Currency" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true, translatable: true, span: 2 },
        { name: "iso2", label: "ISO-2", placeholder: "IN" },
        { name: "iso3", label: "ISO-3", placeholder: "IND" },
        { name: "phone_code", label: "Phone code", placeholder: "+91" },
        { name: "currency_code", label: "Currency code", placeholder: "INR" },
      ]}
      defaults={{ is_active: true }}
    />
  );
}
