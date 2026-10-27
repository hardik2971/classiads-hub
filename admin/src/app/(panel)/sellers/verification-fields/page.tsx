"use client";

import { CrudPage } from "@/components/crud-page";
import { FIELD_TYPES } from "@/lib/constants";

export default function VerificationFields() {
  return (
    <CrudPage
      title="Verification Fields"
      subtitle="Extra fields sellers fill in when requesting the verified badge"
      resource="verification_fields"
      singular="Verification Field"
      activeToggle
      columns={[
        { key: "name", label: "Name", sortable: true, align: "center" },
        { key: "type", label: "Type", align: "center", render: (r) => FIELD_TYPES.find((t) => t.value === r.type)?.label ?? r.type ?? "Text Input" },
        { key: "min_length", label: "Min Length", align: "center", render: (r) => r.min_length ?? "-" },
        { key: "max_length", label: "Max Length", align: "center", render: (r) => r.max_length ?? "-" },
        { key: "values", label: "Values", align: "center", render: (r) => (Array.isArray(r.values) && r.values.length ? r.values.join(", ") : "-") },
        { key: "is_required", label: "Required", align: "center", render: (r) => (r.is_required ? "Yes" : "No") },
      ]}
      fields={[
        { name: "name", label: "Field Name", required: true, translatable: true, span: 2 },
        { name: "type", label: "Field Type", type: "select", options: FIELD_TYPES, span: 2 },
        { name: "min_length", label: "Field Length (Min)", type: "number", showIf: (v) => ["number", "textbox", "textarea"].includes(v.type) },
        { name: "max_length", label: "Field Length (Max)", type: "number", showIf: (v) => ["number", "textbox", "textarea"].includes(v.type) },
        { name: "values", label: "Field Values", type: "list", span: 2, showIf: (v) => ["dropdown", "radio", "checkbox"].includes(v.type) },
        { name: "is_required", label: "Required", type: "toggle" },
        { name: "is_active", label: "Active", type: "toggle" },
      ]}
      defaults={{ type: "textbox", is_required: false, is_active: true, values: [] }}
    />
  );
}
