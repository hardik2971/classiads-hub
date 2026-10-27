"use client";

import { apiRequest, type ApiResult, type RequestOptions } from "./api";

/** Client-side API call; the Firebase ID token of the signed-in user is attached automatically. */
export function clientApi<T>(path: string, opts: RequestOptions = {}): Promise<ApiResult<T>> {
  return apiRequest<T>(path, opts);
}
