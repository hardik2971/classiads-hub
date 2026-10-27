"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Pagination } from "./api";

/** GET hook: { data, meta, loading, error, reload }. Pass null to skip. */
export function useFetch<T = any>(path: string | null, query: Record<string, any> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<{ pagination?: Pagination; [k: string]: unknown } | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(query);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const r = await api<T>(path, { query: JSON.parse(key) });
      if (n !== seq.current) return;
      setData(r.data);
      setMeta(r.meta);
    } catch (e) {
      if (n !== seq.current) return;
      setError(e instanceof ApiError ? e.message : "Failed to load.");
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, meta, loading, error, reload, setData };
}

export function useQueryParam(name: string): string | null {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    setV(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return v;
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
