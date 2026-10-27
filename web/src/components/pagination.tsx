import Link from "next/link";

import { cn } from "@/lib/utils";

/** Link-based pagination that preserves existing query params. */
export function Pagination({
  current,
  last,
  params,
  basePath,
}: {
  current: number;
  last: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (last <= 1) return null;

  const href = (page: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && k !== "page") sp.set(k, v);
    }
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages: number[] = [];
  const from = Math.max(1, current - 2);
  const to = Math.min(last, from + 4);
  for (let i = from; i <= to; i++) pages.push(i);

  const cell = "grid h-10 min-w-10 place-items-center rounded-lg border border-border px-3 text-sm";

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      {current > 1 && (
        <Link href={href(current - 1)} className={cn(cell, "bg-card hover:bg-black/[0.04]")}>
          ‹ Prev
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={cn(cell, p === current ? "bg-brand text-brand-foreground" : "bg-card hover:bg-black/[0.04]")}
        >
          {p}
        </Link>
      ))}
      {current < last && (
        <Link href={href(current + 1)} className={cn(cell, "bg-card hover:bg-black/[0.04]")}>
          Next ›
        </Link>
      )}
    </nav>
  );
}
