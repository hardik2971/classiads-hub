"use client";

import { CrudPage } from "@/components/crud-page";

export default function TipsPage() {
  return (
    <CrudPage
      title="Tips"
      resource="tips"
      singular="Tip"
      createLabel="Add Tip"
      reorderable
      activeToggle
      note="* To change the order, drag the table rows up & down"
      columns={[{ key: "description", label: "Description", sortable: true, render: (r) => <span className="line-clamp-2">{r.description}</span> }]}
      fields={[{ name: "description", label: "Description", type: "textarea", required: true, translatable: true, span: 2 }]}
      defaults={{ is_active: true }}
    />
  );
}
