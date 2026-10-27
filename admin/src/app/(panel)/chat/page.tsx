"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar, Card, cx, IconBtn, PageHeader, Spinner, Thumb, useUi } from "@/components/ui";
import { del } from "@/lib/api";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { useFetch } from "@/lib/hooks";

export default function ChatsPage() {
  const { toast, confirm } = useUi();
  const products = useFetch<any[]>("/admin/chat/products", { per_page: 200 });
  const [ad, setAd] = useState<number | null>(null);
  const [convoId, setConvoId] = useState<number | null>(null);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const convos = useFetch<any[]>(ad ? "/admin/conversations" : null, { ad_id: ad ?? "", per_page: 200 });
  const thread = useFetch<any>(convoId ? `/admin/conversations/${convoId}` : null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("ad")) setAd(Number(p.get("ad")));
    if (p.get("c")) setConvoId(Number(p.get("c")));
  }, []);

  const prodList = useMemo(() => (products.data ?? []).filter((p) => p.title.toLowerCase().includes(q1.toLowerCase())), [products.data, q1]);
  const convoList = useMemo(() => (convos.data ?? []).filter((c) => `${c.buyer?.name} ${c.seller?.name}`.toLowerCase().includes(q2.toLowerCase())), [convos.data, q2]);
  const t = thread.data;
  const unread = (convos.data ?? []).reduce((s, c) => s + (c.unread_count ?? 0), 0);

  return (
    <div>
      <PageHeader title="Message" />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1.6fr]">
        <Card bodyClass="p-0" title="Products" actions={<IconBtn icon="refresh" title="Refresh" onClick={() => void products.reload()} />}>
          <div className="p-3">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="Search..." className="input rounded-full pl-9" />
            </div>
          </div>
          <ul className="max-h-[620px] overflow-y-auto">
            {products.loading && !products.data && <li className="p-6 text-center text-brand"><Spinner /></li>}
            {prodList.map((p) => (
              <li key={p.ad_id}>
                <button onClick={() => { setAd(p.ad_id); setConvoId(null); }} className={cx("flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left transition", ad === p.ad_id ? "bg-brand-50" : "hover:bg-[#fafafd]")}>
                  <Thumb src={p.image} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px]">{p.title}</span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {p.price_display ?? "-"} · {p.conversations} chat{p.conversations === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="self-start text-sm text-brand">{p.last_message_at ? new Date(p.last_message_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                </button>
              </li>
            ))}
            {!products.loading && !prodList.length && <li className="p-6 text-center text-sm text-muted">No conversations yet</li>}
          </ul>
        </Card>

        <Card bodyClass="p-0" title={<div><h2 className="text-lg font-semibold">Chats</h2><p className="text-xs text-muted">{convos.data?.length ?? 0} Conversations, {unread} Unread</p></div>} actions={<IconBtn icon="refresh" title="Refresh" onClick={() => void convos.reload()} />}>
          <div className="p-3">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="Search..." className="input rounded-full pl-9" />
            </div>
          </div>
          {!ad ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-brand">
                <Icon name="search" size={40} />
              </span>
              <p className="text-lg font-semibold text-brand">Select an item to chat</p>
              <p className="text-sm text-muted">Pick an item from the list to view its chats.</p>
            </div>
          ) : (
            <ul className="max-h-[620px] overflow-y-auto">
              {convoList.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setConvoId(c.id)} className={cx("flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left", convoId === c.id ? "bg-brand-50" : "hover:bg-[#fafafd]")}>
                    <Avatar name={c.buyer?.name} src={c.buyer?.avatar_path} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.buyer?.name ?? "Buyer"}</span>
                      <span className="block truncate text-sm text-muted">{c.last_message ?? "No messages"}</span>
                    </span>
                    <span className="text-xs text-muted">{timeAgo(c.last_message_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card bodyClass="p-0 flex flex-col min-h-[560px]">
          {!t ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              {thread.loading ? (
                <Spinner />
              ) : (
                <>
                  <span className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-brand-50 text-brand">
                    <Icon name="chat" size={48} />
                  </span>
                  <p className="text-2xl">No conversation selected yet!</p>
                  <p className="text-sm text-muted">Pick a conversation from the sidebar to view details and messages.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <Thumb src={t.conversation.ad?.images?.[0]?.url} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.conversation.ad?.title ?? "Deleted ad"}</p>
                  <p className="text-sm text-muted">
                    {t.conversation.buyer?.name} ↔ {t.conversation.seller?.name}
                  </p>
                </div>
                <IconBtn
                  icon="trash"
                  title="Delete conversation"
                  tone="danger"
                  onClick={async () => {
                    if (await confirm({ message: "Delete this conversation and all its messages?" })) {
                      await del(`/admin/conversations/${t.conversation.id}`);
                      toast("Conversation deleted.");
                      setConvoId(null);
                      await convos.reload();
                    }
                  }}
                />
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-page/60 p-5">
                {t.messages.map((m: any) => {
                  const seller = m.sender_id === t.conversation.seller?.id;
                  return (
                    <div key={m.id} className={cx("flex", seller ? "justify-end" : "justify-start")}>
                      <div className={cx("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", m.type === "system" ? "bg-accent-50 text-ink" : seller ? "bg-brand text-white" : "bg-white")}>
                        {m.type === "offer" && <p className="mb-1 text-xs font-semibold opacity-80">💰 Offer</p>}
                        <p className="whitespace-pre-line">{m.body}</p>
                        <p className={cx("mt-1 text-[11px]", seller ? "text-white/70" : "text-muted")}>
                          {seller ? t.conversation.seller?.name : t.conversation.buyer?.name} · {fmtDateTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-line px-5 py-3 text-center text-xs text-muted">Read-only moderation view · messages sync in real time on the apps via Firestore</div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
