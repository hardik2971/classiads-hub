/** Minimal classnames joiner (avoids extra deps). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Media URLs come back as absolute Firebase Storage URLs. */
export function mediaUrl(url?: string | null): string | null {
  return url || null;
}

/** Last path segment(s) of the current URL — dynamic routes are served from a static `_` placeholder page. */
export function routeParam(index: number): string {
  if (typeof window === "undefined") return "";
  return decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[index] ?? "");
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}
