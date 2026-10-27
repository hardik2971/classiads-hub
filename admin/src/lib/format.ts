export const fmtDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "-");

export const fmtDateTime = (v?: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const fmtNum = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

export const major = (minor?: number | null) => ((minor ?? 0) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function timeAgo(v?: string | null): string {
  if (!v) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(v).getTime()) / 1000));
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [sec, name] of units) if (s >= sec) {
    const n = Math.floor(s / sec);
    return `${n} ${name}${n > 1 ? "s" : ""}`;
  }
  return "just now";
}

export const maskEmail = (e?: string | null) => (e ? e.replace(/^(.{3}).*(@.*)$/, "$1****$2") : "-");
export const maskPhone = (p?: string | null) => (p ? p.replace(/^(.{3}).*(.{2})$/, "$1****$2") : "-");

export const initials = (name?: string | null) => (name ?? "?").trim().charAt(0).toUpperCase() || "?";

const PALETTE = ["#272757", "#505081", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
export const avatarColor = (seed: string | number = "") => PALETTE[Math.abs([...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTE.length];

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))].join("\n");
}

export function download(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
