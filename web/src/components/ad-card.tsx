import Link from "next/link";

import type { Ad } from "@/lib/types";
import { mediaUrl, timeAgo } from "@/lib/utils";

export function AdCard({ ad }: { ad: Ad }) {
  const img = mediaUrl(ad.images?.find((i) => i.is_primary)?.url ?? ad.images?.[0]?.url);
  const city = ad.location?.city;

  return (
    <Link
      href={`/ad/${ad.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/[0.04]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={ad.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">🖼️</div>
        )}

        {ad.is_featured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
            ★ Featured
          </span>
        )}

        <span
          aria-hidden
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-accent shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 21s-7-4.35-9.5-9.04C.7 8.36 2.84 5 6.2 5c1.74 0 3.41.88 4.3 2.25C11.39 5.88 13.06 5 14.8 5c3.36 0 5.5 3.36 3.7 6.96C19 16.65 12 21 12 21z"/>
          </svg>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-base font-extrabold text-brand">{ad.price_display ?? "—"}</p>
        <p className="line-clamp-2 text-sm font-medium text-foreground">{ad.title}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted">
          <span className="line-clamp-1">{city ?? "—"}</span>
          <span>{timeAgo(ad.published_at ?? ad.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export function AdCardGrid({ ads }: { ads: Ad[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
