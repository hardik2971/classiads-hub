"use client";

import { CrudPage } from "@/components/crud-page";
import { Badge } from "@/components/ui";

export default function ChatTemplates() {
  return (
    <CrudPage
      title="Chat Template"
      subtitle="Manage and create pre-defined chat templates"
      resource="chat_templates"
      singular="Chat Template"
      activeToggle
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "category_ids", label: "Categories", render: (r) => (r.category_ids?.length ? <Badge tone="soft">{r.category_ids.length} categories</Badge> : <Badge tone="success">Global</Badge>) },
        { key: "metrics", label: "Messages and Replies", render: (r) => `${(r.messages ?? []).length} Messages • ${(r.replies ?? []).length} Replies` },
      ]}
      fields={[
        { name: "name", label: "Name", required: true, span: 2 },
        { name: "messages", label: "Buyer quick messages", type: "list", span: 2, placeholder: "e.g. Is this still available?" },
        { name: "replies", label: "Seller quick replies", type: "list", span: 2, placeholder: "e.g. Yes, it is available." },
        { name: "category_ids", label: "Categories (empty = global)", type: "categories", span: 2 },
      ]}
      defaults={{ messages: [], replies: [], category_ids: [], is_active: true }}
    />
  );
}
