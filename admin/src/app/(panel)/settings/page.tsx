"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { SECTIONS } from "@/lib/settings-config";

export default function SettingsHub() {
  const [q, setQ] = useState("");
  const list = SECTIONS.filter((s) => `${s.title} ${s.subtitle}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Workspace</p>
          <h1 className="mt-1 text-3xl font-extrabold">Settings</h1>
          <p className="mt-1 text-sm text-muted">Manage how your platform looks, works, and communicates.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings" className="input rounded-xl py-2.5 pl-9" />
        </div>
      </div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">All settings</h2>
          <p className="text-sm text-muted">Search to find the setting you need.</p>
        </div>
        <span className="text-sm text-muted">{list.length} settings</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((s) => (
          <a key={s.slug} href={`/settings/${s.slug}`} className="group rounded-2xl bg-white p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(39,39,87,0.08)] hover:ring-brand/30">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
              <Icon name={s.icon} size={20} />
            </span>
            <p className="mt-4 font-bold">{s.title}</p>
            <p className="text-xs text-muted">{s.subtitle}</p>
            <div className="mt-3 flex justify-end text-brand transition group-hover:translate-x-1">
              <Icon name="arrowRight" size={18} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
