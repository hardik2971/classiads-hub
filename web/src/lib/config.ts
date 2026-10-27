export const APP_NAME = "ClassiAds_Hub";
export const APP_TAGLINE = "Buy and Sell Anything in Just One Click";

/** Cloud Function base used at build time (sitemap) and during local development. */
export const FUNCTION_API = "https://us-central1-classiadshub.cloudfunctions.net/api/v1";

/**
 * API base: same-origin `/api/v1` on Firebase Hosting (rewritten to the `api` Cloud Function),
 * the function URL when running locally.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "/api/v1" : FUNCTION_API);

/** Public site URL (for canonical/SEO). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://classiadshub.web.app";
