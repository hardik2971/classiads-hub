"use client";

import { useFetch } from "@/lib/hooks";
import { Field, Select } from "./ui";

export interface Loc {
  country_id?: number | "" | null;
  state_id?: number | "" | null;
  city_id?: number | "" | null;
}

/** Cascading Country → State → City selects. */
export function LocationSelect({ value, onChange, levels = 3, required, errors = {} }: { value: Loc; onChange: (v: Loc) => void; levels?: 1 | 2 | 3; required?: boolean; errors?: Record<string, string> }) {
  const countries = useFetch<any[]>("/locations/countries");
  const states = useFetch<any[]>(value.country_id ? "/locations/states" : null, { country_id: value.country_id ?? "" });
  const cities = useFetch<any[]>(value.state_id || value.country_id ? "/locations/cities" : null, value.state_id ? { state_id: value.state_id } : { country_id: value.country_id ?? "" });
  const num = (v: string) => (v ? Number(v) : "");
  return (
    <>
      <Field label="Country" required={required} error={errors.country_id}>
        <Select value={value.country_id ?? ""} onChange={(e) => onChange({ country_id: num(e.target.value), state_id: "", city_id: "" })} options={(countries.data ?? []).map((c) => ({ value: c.id, label: c.name }))} placeholder="--Select Country--" />
      </Field>
      {levels >= 2 && (
        <Field label="State" required={required && levels > 2} error={errors.state_id}>
          <Select value={value.state_id ?? ""} onChange={(e) => onChange({ ...value, state_id: num(e.target.value), city_id: "" })} options={(states.data ?? []).map((s) => ({ value: s.id, label: s.name }))} placeholder="--Select State--" />
        </Field>
      )}
      {levels >= 3 && (
        <Field label="City" required={required} error={errors.city_id}>
          <Select value={value.city_id ?? ""} onChange={(e) => onChange({ ...value, city_id: num(e.target.value) })} options={(cities.data ?? []).map((c) => ({ value: c.id, label: c.name }))} placeholder="--Select City--" />
        </Field>
      )}
    </>
  );
}
