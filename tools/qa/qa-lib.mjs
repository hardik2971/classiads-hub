/** Shared helpers for admin QA scripts (API client with Firebase ID tokens). */
export const BASE = process.env.QA_API ?? "https://us-central1-classiadshub.cloudfunctions.net/api/v1";
export const API_KEY = "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M";

export async function signIn(email, password = "password") {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`sign-in failed for ${email}: ${JSON.stringify(j.error)}`);
  return j.idToken;
}

export async function call(method, path, { token, body, form, query } = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(url, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  let j = null;
  try { j = await r.json(); } catch { /* non-JSON */ }
  return { status: r.status, ...(j ?? {}) };
}

export const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

export const RESOURCES = ["categories", "custom_fields", "countries", "states", "cities", "areas", "currencies", "languages", "faqs", "report_reasons", "tips", "chat_templates", "banner_ads", "verification_fields", "user_queries", "blog_categories", "featured_ad_plans", "email_templates", "roles", "pages", "seo_meta", "sliders", "featured_sections", "packages"];
