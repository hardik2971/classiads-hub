"use client";

import type { CustomField } from "@/lib/types";
import { Field, inputClass } from "@/components/auth/auth-shell";

/** One category custom field (post / edit ad forms). Values are kept as strings keyed by field code. */
export function CustomFieldInput({
  field: f,
  value,
  onChange,
}: {
  field: CustomField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={`${f.name}${f.is_required ? " *" : ""}`}>
      {f.type === "dropdown" || f.type === "radio" ? (
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} required={f.is_required}>
          <option value="">Select</option>
          {f.options?.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
        </select>
      ) : f.type === "textarea" ? (
        <textarea className={`${inputClass} h-24 py-2`} value={value} onChange={(e) => onChange(e.target.value)} required={f.is_required} />
      ) : (
        <input
          className={inputClass}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={f.is_required}
        />
      )}
    </Field>
  );
}
