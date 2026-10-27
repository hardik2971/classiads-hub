"use client";

import { CrudPage } from "@/components/crud-page";
import { useFetch } from "@/lib/hooks";

export default function States() {
  const countries = useFetch<any[]>("/admin/crud/countries", { all: 1 });
  const opts = (countries.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  const name = (id: number) => countries.data?.find((c) => c.id === Number(id))?.name ?? "-";
  return (
    <CrudPage
      title="States"
      resource="states"
      singular="State"
      activeToggle
      filters={[{ key: "country_id", label: "Country", options: opts }]}
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "country_id", label: "Country", sortable: true, render: (r) => name(r.country_id), value: (r) => name(r.country_id) },
        { key: "code", label: "Code", render: (r) => r.code ?? "-" },
      ]}
      fields={[
        { name: "country_id", label: "Country", type: "select", options: opts, required: true },
        { name: "name", label: "Name", required: true, translatable: true },
        { name: "code", label: "Code" },
      ]}
      beforeSubmit={(v) => ({ ...v, country_id: v.country_id ? Number(v.country_id) : null })}
      defaults={{ is_active: true }}
    />
  );
}
