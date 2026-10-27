"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, type ApiResult } from "./api";
import { clientApi } from "./api.client";

interface State<T> {
  data: T | null;
  meta: ApiResult<T>["meta"];
  loading: boolean;
  error: string | null;
}

/** Simple GET hook for client dashboard pages. */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({
    data: null,
    meta: null,
    loading: !!path,
    error: null,
  });

  const reload = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await clientApi<T>(path);
      setState({ data: res.data, meta: res.meta, loading: false, error: null });
    } catch (e) {
      setState({
        data: null,
        meta: null,
        loading: false,
        error: e instanceof ApiError ? e.message : "Failed to load.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, ...deps]);

  return { ...state, reload };
}
