"use client";

import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const SERIES_COLORS = ["#272757", "#FFBF00", "#505081", "#0EA5E9", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

/** Grouped monthly bar chart (values in minor units → shown in major units). */
export function BarChart({ data, series, height = 300 }: { data: Record<string, number>[]; series: { key: string; label: string; color: string }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => (d[s.key] ?? 0) / 100))));
  const W = 760;
  const H = height;
  const pad = { l: 56, r: 8, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const group = iw / 12;
  const bw = Math.min(14, (group - 10) / series.length);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = pad.t + ih * (1 - f);
          return (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e4e4ee" strokeDasharray="4 4" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6b6b8f">
                ${Math.round(max * f).toLocaleString()}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={pad.l + group * i} y={pad.t} width={group} height={ih} fill={hover === i ? "#f3f3f8" : "transparent"} />
            {series.map((s, j) => {
              const v = (d[s.key] ?? 0) / 100;
              const h = Math.max(v > 0 ? 3 : 0, (v / max) * ih);
              const x = pad.l + group * i + (group - bw * series.length - 4 * (series.length - 1)) / 2 + j * (bw + 4);
              return <rect key={s.key} x={x} y={pad.t + ih - h} width={bw} height={h} rx={bw / 2} fill={s.color} />;
            })}
            <text x={pad.l + group * i + group / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b6b8f">
              {MONTHS[i]}
            </text>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg" style={{ left: `${((pad.l + group * hover + group / 2) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <p className="mb-1 font-semibold">{MONTHS[hover]}</p>
          {series.map((s) => (
            <p key={s.key}>
              {s.label}: ${((data[hover][s.key] ?? 0) / 100).toLocaleString()}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Donut with centred total and wrapped legend. */
export function Donut({ items, size = 210, thickness = 26 }: { items: { label: string; value: number; color?: string }[]; size?: number; thickness?: number }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.0+$/, "")}k` : String(n));
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eeeef5" strokeWidth={thickness} />
        {total > 0 &&
          items.map((it, i) => {
            const len = (it.value / total) * c;
            const el = (
              <circle
                key={it.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={it.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${it.label}: ${it.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        <text x="50%" y="46%" textAnchor="middle" fontSize="12" fill="#6b6b8f">
          Total
        </text>
        <text x="50%" y="58%" textAnchor="middle" fontSize="22" fontWeight="600" fill="#0f0e47">
          {fmt(total)}
        </text>
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-sm">
        {items.map((it, i) => (
          <span key={it.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }} />
            <span className="max-w-[130px] truncate">{it.label}</span>
          </span>
        ))}
        {!items.length && <span className="text-muted">No data yet</span>}
      </div>
    </div>
  );
}
