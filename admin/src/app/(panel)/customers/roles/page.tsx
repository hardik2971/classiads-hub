"use client";

import { CrudPage } from "@/components/crud-page";
import { Badge } from "@/components/ui";

export default function RolesPage() {
  return (
    <CrudPage
      title="Role Management"
      resource="roles"
      singular="Role"
      createLabel="Create New Role"
      columns={[
        { key: "id", label: "No.", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "permissions", label: "Permissions", render: (r) => <div className="flex max-w-xl flex-wrap gap-1">{(r.permissions ?? []).map((p: string) => <Badge key={p} tone="soft">{p.replace(/_/g, " ")}</Badge>)}</div> },
      ]}
      fields={[
        { name: "name", label: "Role name", required: true, span: 2, hint: "Assign this role to staff in Staff Management" },
        { name: "permissions", label: "Module access", type: "permissions", span: 2 },
      ]}
      defaults={{ permissions: ["dashboard"] }}
    />
  );
}
