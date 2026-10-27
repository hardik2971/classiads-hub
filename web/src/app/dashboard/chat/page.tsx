"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { clientApi } from "@/lib/api.client";
import { useApi } from "@/lib/use-api";
import type { Ad, User } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { Button, Spinner } from "@/components/ui/button";

interface Conversation {
  id: number;
  role: string;
  unread_count: number;
  last_message?: string | null;
  last_message_at?: string | null;
  counterpart?: User;
  ad?: Ad;
}
interface Message {
  id: number;
  is_mine: boolean;
  type: string;
  body?: string | null;
  created_at?: string;
}

export default function ChatPage() {
  const list = useApi<Conversation[]>("/conversations");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async (id: number) => {
    setActiveId(id);
    const res = await clientApi<{ conversation: Conversation; messages: Message[] }>(`/conversations/${id}`);
    setActive(res.data.conversation);
    setMessages([...res.data.messages].reverse()); // API returns newest-first
    list.reload();
  }, [list]);

  // Deep link from an ad's "Chat" button: /dashboard/chat?c=<conversationId>.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    const c = Number(new URLSearchParams(window.location.search).get("c"));
    if (!c) return;
    opened.current = true;
    void loadConversation(c).catch(() => setActiveId(null));
  }, [loadConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setSending(true);
    try {
      const res = await clientApi<Message>(`/conversations/${activeId}/messages`, {
        method: "POST",
        body: { body: text.trim() },
      });
      setMessages((m) => [...m, res.data]);
      setText("");
    } catch {
      /* keep the draft so the user can retry */
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Chat</h1>
      <div className="grid h-[70vh] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_1fr]">
        {/* List */}
        <div className="overflow-y-auto border-border md:border-r">
          {list.loading && <div className="p-4"><Spinner className="h-6 w-6 text-brand" /></div>}
          {list.data && list.data.length === 0 && (
            <div className="p-6 text-center text-sm text-muted">No conversations yet.</div>
          )}
          {list.data?.map((c) => (
            <button
              key={c.id}
              onClick={() => loadConversation(c.id)}
              className={`flex w-full items-start gap-3 border-b border-border p-3 text-left ${activeId === c.id ? "bg-brand/[0.06]" : "hover:bg-black/[0.03]"}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">
                {c.counterpart?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <span className="truncate font-medium">{c.counterpart?.name ?? "User"}</span>
                  {c.unread_count > 0 && (
                    <span className="ml-2 rounded-full bg-brand px-1.5 text-xs text-white">{c.unread_count}</span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">{c.ad?.title}</p>
                <p className="truncate text-xs text-foreground/70">{c.last_message}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Window */}
        <div className="flex flex-col">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState title="Select a conversation" subtitle="Choose a chat to view messages." icon="💬" />
            </div>
          ) : (
            <>
              <div className="border-b border-border p-3">
                <p className="font-semibold">{active?.counterpart?.name}</p>
                <p className="text-xs text-muted">{active?.ad?.title} · {active?.ad?.price_display}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        m.type === "system"
                          ? "bg-amber-50 text-amber-700"
                          : m.is_mine
                            ? "bg-brand text-white"
                            : "bg-black/[0.05]"
                      }`}
                    >
                      {m.body}
                      <div className={`mt-0.5 text-[10px] ${m.is_mine ? "text-white/70" : "text-muted"}`}>
                        {timeAgo(m.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                />
                <Button type="submit" loading={sending}>Send</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
