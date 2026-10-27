"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Pagination } from "@/lib/api";
import { download, toCsv } from "@/lib/format";
import { Icon } from "./icon";
import { cx, Empty, Spinner } from "./ui";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
  /** Value used for sorting + CSV export (defaults to row[key]). */
  value?: (row: T) => unknown;
  hidden?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | null;
  loading?: boolean;
  error?: string | null;
  pagination?: Pagination | null;
  onPage?: (page: number) => void;
  perPage?: number;
  onPerPage?: (n: number) => void;
  search?: string;
  onSearch?: (q: string) => void;
  onRefresh?: () => void;
  exportName?: string;
  selectable?: boolean;
  selected?: (string | number)[];
  onSelect?: (ids: (string | number)[]) => void;
  rowKey?: (row: T) => string | number;
  toolbar?: React.ReactNode;
  emptyText?: string;
  onReorder?: (ids: (string | number)[]) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  error,
  pagination,
  onPage,
  perPage = 10,
  onPerPage,
  search,
  onSearch,
  onRefresh,
  exportName,
  selectable,
  selected = [],
  onSelect,
  rowKey = (r) => r.id,
  toolbar,
  emptyText,
  onReorder,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.hidden).map((c) => c.key));
  const [colMenu, setColMenu] = useState(false);
  const [dragId, setDragId] = useState<string | number | null>(null);
  const [order, setOrder] = useState<T[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOrder(null), [rows]);
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setColMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const visible = columns.filter((c) => !hidden.includes(c.key));
  const valueOf = (c: Column<T>, r: T) => (c.value ? c.value(r) : r[c.key]);

  const sorted = useMemo(() => {
    const base = order ?? rows ?? [];
    if (!sort) return base;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return base;
    return [...base].sort((a, b) => {
      const x = valueOf(col, a) as any;
      const y = valueOf(col, b) as any;
      if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir;
      return String(x ?? "").localeCompare(String(y ?? "")) * sort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, order, sort, columns]);

  const allIds = sorted.map(rowKey);
  const allChecked = selectable && allIds.length > 0 && allIds.every((id) => selected.includes(id));

  const exportCsv = () => {
    const cols = visible.filter((c) => c.key !== "actions").map((c) => ({ key: c.key, label: c.label }));
    const data = sorted.map((r) => Object.fromEntries(visible.map((c) => [c.key, valueOf(c, r)])));
    download(`${exportName ?? "export"}.csv`, toCsv(data, cols));
  };

  const onDrop = (targetId: string | number) => {
    if (dragId === null || dragId === targetId) return;
    const list = [...sorted];
    const from = list.findIndex((r) => rowKey(r) === dragId);
    const to = list.findIndex((r) => rowKey(r) === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setOrder(list);
    setDragId(null);
    onReorder?.(list.map(rowKey));
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        <div className="flex items-stretch">
          {onSearch && (
            <input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="input w-56 rounded-r-none"
            />
          )}
          <div className={cx("flex overflow-visible bg-secondary text-white", onSearch ? "rounded-r-lg" : "rounded-lg")}>
            {onRefresh && (
              <button type="button" title="Refresh" onClick={onRefresh} className="px-3 hover:bg-white/10">
                <Icon name="refresh" size={16} />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button type="button" title="Columns" onClick={() => setColMenu((v) => !v)} className="h-full px-3 hover:bg-white/10">
                <Icon name="columns" size={16} />
              </button>
              {colMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl bg-white p-2 text-ink shadow-xl ring-1 ring-line">
                  {columns
                    .filter((c) => c.key !== "actions")
                    .map((c) => (
                      <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-brand-50">
                        <input type="checkbox" checked={!hidden.includes(c.key)} onChange={() => setHidden((h) => (h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]))} />
                        {c.label}
                      </label>
                    ))}
                </div>
              )}
            </div>
            {exportName && (
              <button type="button" title="Export CSV" onClick={exportCsv} className="px-3 hover:bg-white/10">
                <Icon name="download" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[#f6f6fa] text-left text-ink">
            <tr>
              {onReorder && <th className="w-8" />}
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={!!allChecked} onChange={() => onSelect?.(allChecked ? selected.filter((id) => !allIds.includes(id)) : [...new Set([...selected, ...allIds])])} />
                </th>
              )}
              {visible.map((c) => (
                <th
                  key={c.key}
                  className={cx("whitespace-nowrap px-3 py-3 font-semibold", c.align === "center" && "text-center", c.align === "right" && "text-right", c.sortable && "cursor-pointer select-none")}
                  onClick={() => c.sortable && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.sortable && <Icon name={sort?.key === c.key ? (sort.dir === 1 ? "chevronUp" : "chevronDown") : "sort"} size={12} className={sort?.key === c.key ? "text-brand" : "text-muted/60"} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows ? (
              <tr>
                <td colSpan={visible.length + 2} className="py-10 text-center text-brand">
                  <Spinner />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visible.length + 2} className="py-8 text-center text-danger">
                  {error}
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={visible.length + 2}>
                  <Empty text={emptyText} />
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => {
                const id = rowKey(r);
                return (
                  <tr
                    key={id}
                    draggable={!!onReorder}
                    onDragStart={() => setDragId(id)}
                    onDragOver={(e) => onReorder && e.preventDefault()}
                    onDrop={() => onDrop(id)}
                    className={cx("border-t border-line transition hover:bg-[#fafafd]", loading && "opacity-60", dragId === id && "bg-brand-50")}
                  >
                    {onReorder && (
                      <td className="cursor-grab px-2 text-muted">
                        <Icon name="drag" size={16} />
                      </td>
                    )}
                    {selectable && (
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.includes(id)} onChange={() => onSelect?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])} />
                      </td>
                    )}
                    {visible.map((c) => (
                      <td key={c.key} className={cx("px-3 py-3 align-middle text-[#3b3a63]", c.align === "center" && "text-center", c.align === "right" && "text-right", c.className)}>
                        {c.render ? c.render(r, i) : (r[c.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span>
              Showing {pagination.from ?? 0} to {pagination.to ?? 0} of {pagination.total} entries
            </span>
            {onPerPage && (
              <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))} className="rounded-md bg-secondary px-2 py-1 text-white">
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
            {onPerPage && <span>rows per page</span>}
          </div>
          {pagination.last_page > 1 && onPage && <Pager p={pagination} onPage={onPage} />}
        </div>
      )}
    </div>
  );
}

function Pager({ p, onPage }: { p: Pagination; onPage: (n: number) => void }) {
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= p.last_page; i++) {
    if (i === 1 || i === p.last_page || Math.abs(i - p.current_page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  // Colour classes are kept mutually exclusive (no tailwind-merge): the active page must not also get bg-white.
  const base = "min-w-9 h-9 px-2 border text-sm transition";
  const btn = `${base} border-line bg-white hover:bg-brand-50`;
  return (
    <div className="flex overflow-hidden rounded-lg">
      <button className={cx(btn, "rounded-l-lg")} disabled={p.current_page === 1} onClick={() => onPage(p.current_page - 1)}>
        ‹
      </button>
      {pages.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className={cx(btn, "inline-flex items-center justify-center")}>
            …
          </span>
        ) : (
          <button key={n} className={n === p.current_page ? cx(base, "border-brand bg-brand font-semibold text-white") : btn} aria-current={n === p.current_page ? "page" : undefined} onClick={() => onPage(n)}>
            {n}
          </button>
        ),
      )}
      <button className={cx(btn, "rounded-r-lg")} disabled={p.current_page === p.last_page} onClick={() => onPage(p.current_page + 1)}>
        ›
      </button>
    </div>
  );
}
