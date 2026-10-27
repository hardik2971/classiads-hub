"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Card, Field, IconBtn, Input, Modal, PageHeader, Select, Toggle, UserCell, useUi } from "@/components/ui";
import { ApiError, api, del, put } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useFetch } from "@/lib/hooks";

export default function StaffPage() {
  const { toast, confirm } = useUi();
  const { user } = useAuth();
  const list = useFetch<any[]>("/admin/staff", { per_page: 200 });
  const roles = useFetch<any[]>("/admin/crud/roles", { all: 1 });
  const [edit, setEdit] = useState<any | null>(null);
  const [v, setV] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const roleOf = (u: any) => (u.roles ?? []).find((r: string) => !["staff", "customer", "seller"].includes(r)) ?? (u.roles?.includes("staff") ? "staff" : "");
  const isSuper = user?.roles.includes("super-admin");
  const roleOptions = [...(isSuper || user?.roles.includes("admin") ? [{ value: "admin", label: "Administrator (full access)" }] : []), ...(roles.data ?? []).map((r) => ({ value: r.name, label: r.name }))];

  const open = (u?: any) => {
    setErrors({});
    setEdit(u ?? {});
    setV(u ? { name: u.name, email: u.email, role: roleOf(u), status: u.status } : { status: "active", role: roles.data?.[0]?.name ?? "staff" });
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (edit?.id) await put(`/admin/staff/${edit.id}`, { name: v.name, email: v.email, role: v.role, status: v.status, ...(v.password ? { password: v.password } : {}) });
      else await api("/admin/staff", { method: "POST", body: v });
      toast(edit?.id ? "Staff updated." : "Staff created.");
      setEdit(null);
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
      <PageHeader title="Staff Management" actions={<Button onClick={() => open()}>Create New Staff</Button>} />
      <Card>
        <DataTable
          rows={list.data}
          loading={list.loading}
          error={list.error}
          onRefresh={() => void list.reload()}
          exportName="staff"
          columns={[
            { key: "name", label: "Name", sortable: true, render: (r) => <UserCell user={r} /> },
            { key: "email", label: "Email", sortable: true, align: "center" },
            { key: "role", label: "Role", align: "center", render: (r) => <Badge tone={r.roles?.includes("super-admin") || r.roles?.includes("admin") ? "brand" : "soft"}>{r.roles?.includes("super-admin") ? "Super admin" : r.roles?.includes("admin") ? "Admin" : roleOf(r)}</Badge> },
            {
              key: "status",
              label: "Status",
              align: "center",
              render: (r) => (
                <Toggle
                  disabled={r.roles?.includes("super-admin") || r.id === user?.id}
                  checked={r.status === "active"}
                  onChange={async (x) => {
                    await put(`/admin/staff/${r.id}`, { status: x ? "active" : "suspended" });
                    await list.reload();
                  }}
                />
              ),
            },
            {
              key: "actions",
              label: "Action",
              align: "center",
              render: (r) =>
                r.roles?.includes("super-admin") && !isSuper ? (
                  "-"
                ) : (
                  <div className="flex justify-center gap-1.5">
                    <IconBtn icon="edit" title="Edit" onClick={() => open(r)} />
                    <IconBtn icon="key" title="Change password" onClick={() => { open(r); }} />
                    {r.id !== user?.id && !r.roles?.includes("super-admin") && (
                      <IconBtn icon="trash" title="Remove" tone="danger" onClick={async () => { if (await confirm({ message: `Remove ${r.name} from staff? Their admin access is revoked.` })) { await del(`/admin/staff/${r.id}`); toast("Staff removed."); await list.reload(); } }} />
                    )}
                  </div>
                ),
            },
          ]}
        />
      </Card>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? "Edit Staff" : "Create New Staff"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name}>
            <Input value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
          <Field label={edit?.id ? "New password (optional)" : "Password"} required={!edit?.id} error={errors.password}>
            <Input type="password" value={v.password ?? ""} onChange={(e) => setV({ ...v, password: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label="Role" required error={errors.role}>
            <Select value={v.role ?? ""} onChange={(e) => setV({ ...v, role: e.target.value })} options={roleOptions} placeholder="Select role" />
          </Field>
          <Field label="Status">
            <Select value={v.status ?? "active"} onChange={(e) => setV({ ...v, status: e.target.value })} options={[{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]} />
          </Field>
        </div>
        <p className="mt-4 text-sm text-muted">
          Roles control which admin modules a staff member can open. Manage them in <a href="/customers/roles" className="text-brand underline">Role</a>.
        </p>
      </Modal>
    </div>
  );
}
