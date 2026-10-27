"use client";

import { CrudPage } from "@/components/crud-page";
import { IconBtn } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export default function UserQueries() {
  return (
    <CrudPage
      title="User Queries"
      subtitle="Messages sent through the Contact Us form"
      resource="user_queries"
      singular="Query"
      readOnly
      columns={[
        { key: "name", label: "Name", sortable: true, align: "center" },
        { key: "email", label: "Email", sortable: true, align: "center" },
        { key: "subject", label: "Subject", sortable: true, align: "center" },
        { key: "message", label: "Message", render: (r) => <span className="line-clamp-2 max-w-md">{r.message}</span> },
        { key: "created_at", label: "Received", sortable: true, render: (r) => fmtDateTime(r.created_at) },
      ]}
      fields={[]}
      extraActions={(r) => <IconBtn icon="mail" title="Reply by e-mail" href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject ?? ""}`)}`} />}
    />
  );
}
