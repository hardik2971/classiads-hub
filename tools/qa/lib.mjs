export const BASE = "https://us-central1-classiadshub.cloudfunctions.net/api/v1";
export const API_KEY = "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M";
export async function signIn(email, password = "password") {
  // resolve auth email like the site does
  const l = await call("POST", "/auth/login", { body: { login: email, email, password } });
  const authEmail = l.data?.auth_email ?? email;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: authEmail, password, returnSecureToken: true }) });
  const j = await r.json();
  if (!j.idToken) throw new Error(`sign-in failed ${email}: ${JSON.stringify(j.error)} / login: ${JSON.stringify(l).slice(0,200)}`);
  return j.idToken;
}
export async function call(method, path, { token, body, form, query } = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(url, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, ...(j ?? {}) };
}
