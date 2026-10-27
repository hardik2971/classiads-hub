import { API_BASE } from "./config";
import { auth, authReady } from "./firebase";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status = 0, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

export interface ApiResult<T> {
  data: T;
  message: string;
  meta?: { pagination?: import("./types").Pagination; [k: string]: unknown } | null;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Explicit bearer token; defaults to the signed-in Firebase user's ID token. */
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  formData?: FormData;
}

/** Isomorphic request that unwraps the API envelope and throws ApiError on failure. */
export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiResult<T>> {
  const url = new URL(API_BASE + path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token === undefined) await authReady;
  const token = opts.token ?? (await auth.currentUser?.getIdToken().catch(() => null));
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined && !opts.formData) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      cache: opts.cache ?? "no-store",
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  let json: Record<string, unknown> | null = null;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    if (res.ok) return { data: null as T, message: "" };
    throw new ApiError(`Unexpected response (HTTP ${res.status}).`, res.status);
  }

  if (res.ok && json?.success === true) {
    return {
      data: json.data as T,
      message: (json.message as string) ?? "",
      meta: (json.meta as ApiResult<T>["meta"]) ?? null,
    };
  }

  const rawErrors = json?.errors;
  let errors: Record<string, string[]> | undefined;
  if (rawErrors && typeof rawErrors === "object") {
    errors = {};
    for (const [k, v] of Object.entries(rawErrors as Record<string, unknown>)) {
      errors[k] = Array.isArray(v) ? v.map(String) : [String(v)];
    }
  }
  throw new ApiError((json?.message as string) ?? "Request failed.", res.status, errors);
}
