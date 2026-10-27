"use client";

import { CrudPage } from "@/components/crud-page";

export default function FaqsPage() {
  return (
    <CrudPage
      title="FAQ"
      resource="faqs"
      singular="FAQ"
      layout="stacked"
      columns={[
        { key: "question", label: "Questions", sortable: true },
        { key: "answer", label: "Answers", render: (r) => <span className="line-clamp-2 max-w-xl">{r.answer}</span> },
      ]}
      fields={[
        { name: "question", label: "Question", required: true, translatable: true, span: 2 },
        { name: "answer", label: "Answer", type: "textarea", required: true, translatable: true, span: 2 },
      ]}
      activeToggle
      reorderable
      defaults={{ is_active: true }}
    />
  );
}
