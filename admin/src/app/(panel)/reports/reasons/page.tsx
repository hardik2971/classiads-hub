"use client";

import { CrudPage } from "@/components/crud-page";

export default function ReportReasons() {
  return (
    <CrudPage
      title="Report Reasons"
      resource="report_reasons"
      singular="Reason"
      layout="side"
      columns={[{ key: "reason", label: "Reason", sortable: true }]}
      fields={[{ name: "reason", label: "Reason", type: "textarea", required: true, translatable: true }]}
      defaults={{ is_active: true }}
    />
  );
}
