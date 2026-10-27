"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { LocationSelect } from "@/components/location-select";
import { Button, Card, Field, IconBtn, Input, PageHeader, Toggle, useUi } from "@/components/ui";
import { api, ApiError, del, put } from "@/lib/api";
import { useDebounced, useFetch } from "@/lib/hooks";

const MapPicker = dynamic(() => import("@/components/map-picker").then((m) => m.MapPicker), { ssr: false });

/** Shared City / Area management: map-backed form on top, list below (reference layout). */
export function PlacePage({ kind }: { kind: "city" | "area" }) {
  const resource = kind === "city" ? "cities" : "areas";
  const label = kind === "city" ? "City" : "Area";
  const { toast, confirm } = useUi();
  const countries = useFetch<any[]>("/admin/crud/countries", { all: 1 });
  const states = useFetch<any[]>("/admin/crud/states", { all: 1 });
  const cities = useFetch<any[]>(kind === "area" ? "/admin/crud/cities" : null, { all: 1 });
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  useEffect(() => setPage(1), [q, per]);
  const list = useFetch<any[]>(`/admin/crud/${resource}`, { q, page, per_page: per });
  const blank = { country_id: "", state_id: "", city_id: "", name: "", latitude: "", longitude: "" };
  const [v, setV] = useState<Record<string, any>>(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const nameOf = (coll: any[] | null, id: unknown) => coll?.find((x) => x.id === Number(id))?.name ?? "-";

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const body: Record<string, any> = { name: v.name, country_id: v.country_id || null, state_id: v.state_id || null, latitude: v.latitude === "" ? null : Number(v.latitude), longitude: v.longitude === "" ? null : Number(v.longitude) };
      if (kind === "area") body.city_id = v.city_id || null;
      await api(editing ? `/admin/crud/${resource}/${editing}` : `/admin/crud/${resource}`, { method: editing ? "PUT" : "POST", body });
      toast(editing ? `${label} updated.` : `${label} added.`);
      setV(blank);
      setEditing(null);
      await list.reload();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, x]) => [k, x[0]])));
        toast(e.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title={kind === "city" ? "Cities" : "Area"} />
      <Card title={editing ? `Edit ${label}` : `Add ${label}`}>
        <div className={`grid gap-4 ${kind === "area" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <LocationSelect value={v} onChange={(l) => setV({ ...v, ...l })} levels={kind === "area" ? 3 : 2} required errors={errors} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Field label={`${label} Name`} required error={errors.name}>
            <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder={`Enter ${label} name`} />
          </Field>
          <Field label="Latitude" error={errors.latitude}>
            <Input type="number" step="any" value={v.latitude} onChange={(e) => setV({ ...v, latitude: e.target.value })} placeholder="Enter Latitude" />
          </Field>
          <Field label="Longitude" error={errors.longitude}>
            <Input type="number" step="any" value={v.longitude} onChange={(e) => setV({ ...v, longitude: e.target.value })} placeholder="Enter Longitude" />
          </Field>
        </div>
        {kind === "area" && <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm text-ink">Please select the correct location on the map. Do not place the marker for any other location.</p>}
        <div className="mt-4">
          <MapPicker lat={v.latitude === "" ? null : Number(v.latitude)} lng={v.longitude === "" ? null : Number(v.longitude)} onChange={(lat, lng) => setV((s) => ({ ...s, latitude: lat, longitude: lng }))} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); setV(blank); }}>
              Cancel
            </Button>
          )}
          <Button loading={saving} onClick={() => void save()}>
            {editing ? "Update" : "Save"}
          </Button>
        </div>
      </Card>
      <Card className="mt-6">
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          pagination={list.meta?.pagination}
          onPage={setPage}
          perPage={per}
          onPerPage={setPer}
          search={search}
          onSearch={setSearch}
          onRefresh={() => void list.reload()}
          exportName={resource}
          columns={[
            { key: "name", label: "Name", sortable: true },
            ...(kind === "area" ? [{ key: "city_id", label: "City", render: (r: any) => nameOf(cities.data, r.city_id) }] : []),
            { key: "state_id", label: "State", render: (r) => nameOf(states.data, r.state_id) },
            { key: "country_id", label: "Country", render: (r) => nameOf(countries.data, r.country_id) },
            { key: "coords", label: "Coordinates", render: (r) => (r.latitude != null ? `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}` : "-") },
            { key: "is_active", label: "Status", align: "center", render: (r) => <Toggle checked={r.is_active !== false} onChange={async (x) => { await put(`/admin/crud/${resource}/${r.id}`, { is_active: x }); await list.reload(); }} /> },
            {
              key: "actions",
              label: "Action",
              render: (r) => (
                <div className="flex gap-1.5">
                  <IconBtn icon="edit" title="Edit" onClick={() => { setEditing(r.id); setV({ country_id: r.country_id ?? "", state_id: r.state_id ?? "", city_id: r.city_id ?? "", name: r.name, latitude: r.latitude ?? "", longitude: r.longitude ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                  <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: `Delete ${r.name}?` })) { await del(`/admin/crud/${resource}/${r.id}`); toast("Deleted."); await list.reload(); } }} />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
