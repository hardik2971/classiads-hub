"use client";

import { CrudPage } from "@/components/crud-page";
import { Badge } from "@/components/ui";

export default function Currencies() {
  return (
    <CrudPage
      title="Currencies"
      resource="currencies"
      singular="Currency"
      activeToggle
      columns={[
        { key: "code", label: "ISO Code", sortable: true, render: (r) => <span className="flex items-center gap-2">{r.code}{r.is_default && <Badge tone="accent">Default</Badge>}</span> },
        { key: "name", label: "Name", sortable: true },
        { key: "symbol", label: "Symbol" },
        { key: "symbol_position", label: "Symbol Position", render: (r) => r.symbol_position ?? "left" },
        { key: "country", label: "Country", sortable: true, render: (r) => r.country ?? "-" },
      ]}
      fields={[
        { name: "code", label: "ISO Code", required: true, placeholder: "USD" },
        { name: "name", label: "Name", required: true },
        { name: "symbol", label: "Symbol", required: true, placeholder: "$" },
        { name: "symbol_position", label: "Symbol Position", type: "select", options: [{ value: "left", label: "Left ($100)" }, { value: "right", label: "Right (100$)" }] },
        { name: "country", label: "Country" },
        { name: "decimal_digits", label: "Decimal digits", type: "number" },
        { name: "is_default", label: "Default currency", type: "toggle" },
      ]}
      defaults={{ symbol_position: "left", decimal_digits: 2, is_active: true }}
    />
  );
}
