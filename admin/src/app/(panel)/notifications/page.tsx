"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button, Card, Field, FileInput, IconBtn, Input, PageHeader, Select, Textarea, Thumb, useUi } from "@/components/ui";
import { api, ApiError, del, toForm } from "@/lib/api";
import { useDebounced, useFetch } from "@/lib/hooks";

export default function NotificationsPage() {
  const { toast, confirm } = useUi();
  const [v, setV] = useState({ target: "all", title: "", body: "", item_id: "" });
  const [withImage, setWithImage] = useState(false);
  const [image, setImage] = useState<File[]>([]);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [uSearch, setUSearch] = useState("");
  const uq = useDebounced(uSearch);
  const [uPage, setUPage] = useState(1);
  const [hPage, setHPage] = useState(1);
  useEffect(() => setUPage(1), [uq]);
  const users = useFetch<any[]>("/admin/users", { q: uq, page: uPage, per_page: 10 });
  const ads = useFetch<any[]>("/admin/ads", { status: "approved", per_page: 100 });
  const history = useFetch<any[]>("/admin/push-notifications", { page: hPage, per_page: 10 });

  const send = async () => {
    setSending(true);
    setErrors({});
    try {
      const body: Record<string, any> = { title: v.title, body: v.body, target: v.target === "selected" ? "selected" : "all" };
      if (v.target === "selected") body.user_ids = selected;
      if (v.item_id) Object.assign(body, { item_type: "ad", item_id: Number(v.item_id) });
      const form = toForm(body);
      if (withImage && image[0]) form.append("image", image[0]);
      const r = await api("/admin/push-notifications", { method: "POST", form });
      toast(r.message);
      setV({ target: v.target, title: "", body: "", item_id: "" });
      setImage([]);
      setSelected([]);
      await history.reload();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, x]) => [k, x[0]])));
        toast(e.message, "error");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Send Notification" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="self-start">
          <div className="space-y-4">
            <Field label="Select User" required>
              <Select value={v.target} onChange={(e) => setV({ ...v, target: e.target.value })} options={[{ value: "all", label: "All" }, { value: "selected", label: "Selected users" }]} />
            </Field>
            <Field label="Title" required error={errors.title}>
              <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Title" />
            </Field>
            <Field label="Message" required error={errors.body}>
              <Textarea value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} placeholder="Message" />
            </Field>
            <label className="flex items-center gap-2 text-[15px]">
              <input type="checkbox" className="h-4 w-4 accent-[#272757]" checked={withImage} onChange={(e) => setWithImage(e.target.checked)} /> Include Image
            </label>
            {withImage && <FileInput onChange={setImage} preview={image[0] ? URL.createObjectURL(image[0]) : null} />}
            <Field label="Advertisement" hint="Tapping the notification opens this ad">
              <Select value={v.item_id} onChange={(e) => setV({ ...v, item_id: e.target.value })} options={(ads.data ?? []).map((a) => ({ value: a.id, label: a.title }))} placeholder="Select Advertisement" />
            </Field>
            {v.target === "selected" && <p className="text-sm text-muted">{selected.length} user(s) selected in the list.</p>}
            {errors.user_ids && <p className="text-sm text-danger">{errors.user_ids}</p>}
            <div className="flex justify-end">
              <Button icon="send" loading={sending} disabled={v.target === "selected" && !selected.length} onClick={() => void send()}>
                Submit
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <DataTable
            selectable={v.target === "selected"}
            selected={selected}
            onSelect={setSelected}
            rows={users.data}
            loading={users.loading}
            pagination={users.meta?.pagination}
            onPage={setUPage}
            search={uSearch}
            onSearch={setUSearch}
            onRefresh={() => void users.reload()}
            columns={[
              { key: "name", label: "Name", sortable: true },
              { key: "phone", label: "Number", render: (r) => r.phone ?? "-" },
            ]}
          />
        </Card>
      </div>
      <Card className="mt-6">
        <DataTable
          rows={history.data}
          loading={history.loading}
          pagination={history.meta?.pagination}
          onPage={setHPage}
          onRefresh={() => void history.reload()}
          exportName="notifications"
          columns={[
            { key: "title", label: "Title", sortable: true },
            { key: "body", label: "Message", render: (r) => <span className="line-clamp-2">{r.body}</span> },
            { key: "image", label: "Image", render: (r) => (r.image_url ? <Thumb src={r.image_url} size={52} /> : "-") },
            { key: "target", label: "Send To", render: (r) => r.target },
            { key: "recipients_count", label: "Recipients", align: "center" },
            { key: "actions", label: "Action", render: (r) => <IconBtn icon="trash" title="Delete" tone="danger" onClick={async () => { if (await confirm({ message: "Delete this history entry?" })) { await del(`/admin/push-notifications/${r.id}`); await history.reload(); } }} /> },
          ]}
        />
      </Card>
    </div>
  );
}
