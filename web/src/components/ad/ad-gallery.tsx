"use client";

import { useState } from "react";

import type { AdImage } from "@/lib/types";
import { mediaUrl } from "@/lib/utils";

export function AdGallery({ images, title }: { images: AdImage[]; title: string }) {
  const urls = images.map((i) => mediaUrl(i.url)).filter(Boolean) as string[];
  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-border bg-card text-5xl text-muted">
        🖼️
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[active]} alt={title} className="aspect-[4/3] w-full object-contain" />
      </div>
      {urls.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {urls.map((u, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-brand" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
