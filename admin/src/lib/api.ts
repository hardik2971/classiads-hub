import { auth } from "./firebase";

/** Same-origin in production (Hosting rewrite); the function URL during local dev. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "https://us-central1-classiadshub.cloudfunctions.net/api/v1"
    : "/api/v1");

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface ApiResult<T> {
  data: T;
  message: string;
  meta: { pagination?: Pagination; [k: string]: unknown } | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
  field(name: string) {
    return this.errors?.[name]?.[0];
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData; query?: Query } = {}): Promise<ApiResult<T>> {
  const url = new URL(API_BASE + path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url.toString(), { method: opts.method ?? "GET", headers, body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined) });
  } catch {
    throw new ApiError("Cannot reach the server.", 0);
  }
  const json = await res.json().catch(() => null);
  if (res.ok && json?.success) return { data: json.data as T, message: json.message ?? "", meta: json.meta ?? null };
  throw new ApiError(json?.message ?? `Request failed (HTTP ${res.status}).`, res.status, json?.errors ?? undefined);
}

export const get = <T = any>(path: string, query?: Query) => api<T>(path, { query });
export const post = <T = any>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body ?? {} });
export const put = <T = any>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body: body ?? {} });
export const del = <T = any>(path: string) => api<T>(path, { method: "DELETE" });
export const send = <T = any>(path: string, form: FormData, method = "POST") => api<T>(path, { method, form });

/** Build FormData from a plain object (arrays/objects → JSON, files kept as-is). */
export function toForm(values: Record<string, unknown>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) continue;
    if (v instanceof File) f.append(k, v);
    // Empty arrays must still be sent ("[]") so clearing a list (category scope, tags, …) persists.
    else if (Array.isArray(v) && v.length > 0 && v.every((x) => x instanceof File)) v.forEach((file) => f.append(k, file as File));
    else if (v === null) f.append(k, "");
    else if (typeof v === "object") f.append(k, JSON.stringify(v));
    else if (typeof v === "boolean") f.append(k, v ? "1" : "0");
    else f.append(k, String(v));
  }
  return f;
}
