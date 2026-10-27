"use client";

import { CrudPage } from "@/components/crud-page";

export default function BlogCategories() {
  return (
    <CrudPage
      title="Blog Category"
      resource="blog_categories"
      singular="Blog Category"
      createLabel="Add Blog Category"
      activeToggle
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "slug", label: "Slug", sortable: true },
      ]}
      fields={[
        { name: "name", label: "Name", required: true, translatable: true, span: 2 },
        { name: "slug", label: "Slug", hint: "Generated from the name when empty", span: 2 },
        { name: "sort_order", label: "Sort order", type: "number" },
      ]}
      defaults={{ is_active: true }}
    />
  );
}
