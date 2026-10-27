/**
 * End-to-end API QA against the deployed Firebase backend.
 *   node tools/qa/api-qa.mjs [baseUrl]
 * Signs in real Firebase users, exercises every route group, cleans up after itself,
 * and prints a pass/fail table. Exit code 1 if anything failed.
 */
const BASE = process.argv[2] ?? "https://us-central1-classiadshub.cloudfunctions.net/api/v1";
const API_KEY = "AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M";
const results = [];
const stamp = Date.now().toString(36);

async function signIn(email, password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`sign-in failed for ${email}: ${JSON.stringify(j.error)}`);
  return j.idToken;
}

async function call(method, path, { token, body, form, query } = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(url, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  let j = null;
  try {
    j = await r.json();
  } catch {
    /* non-JSON */
  }
  return { status: r.status, ...(j ?? {}) };
}

async function check(name, fn) {
  const t = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - t, detail: detail ?? "" });
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t, detail: e.message });
  }
}

function expect(res, status = 200, msg = "") {
  if (res.status !== status || (status < 300 && res.success !== true)) {
    throw new Error(`HTTP ${res.status} (want ${status}) ${res.message ?? ""} ${msg} ${res.errors ? JSON.stringify(res.errors) : ""}`.trim());
  }
  return res;
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const imageBlob = () => new Blob([PNG], { type: "image/png" });

const ctx = {};

// ---------------- public ----------------
await check("GET /health", async () => expect(await call("GET", "/health")).data.service);
await check("GET /health/ready", async () => expect(await call("GET", "/health/ready")).data.status);
await check("GET /categories", async () => `${expect(await call("GET", "/categories")).data.length} categories`);
await check("GET /categories?roots_only", async () => `${expect(await call("GET", "/categories", { query: { roots_only: 1 } })).data.length} roots`);
await check("GET /categories/tree", async () => {
  const r = expect(await call("GET", "/categories/tree"));
  ctx.category = r.data.find((c) => c.children?.length)?.children[0] ?? r.data[0];
  return `${r.data.length} roots`;
});
await check("GET /categories/:slug", async () => expect(await call("GET", `/categories/${ctx.category.slug}`)).data.name);
await check("GET /categories/:id/custom-fields", async () => `${expect(await call("GET", `/categories/${ctx.category.id}/custom-fields`)).data.length} fields`);
await check("GET /locations/countries", async () => {
  const r = expect(await call("GET", "/locations/countries"));
  ctx.country = r.data[0];
  return `${r.data.length}`;
});
await check("GET /locations/states", async () => {
  const r = expect(await call("GET", "/locations/states", { query: { country_id: ctx.country.id } }));
  ctx.state = r.data[0];
  return `${r.data.length}`;
});
await check("GET /locations/states (validation)", async () => expect(await call("GET", "/locations/states"), 422).message);
await check("GET /locations/cities", async () => {
  const r = expect(await call("GET", "/locations/cities", { query: ctx.state ? { state_id: ctx.state.id } : {} }));
  ctx.city = r.data[0];
  return `${r.data.length}`;
});
await check("GET /languages", async () => `${expect(await call("GET", "/languages")).data.length}`);
await check("GET /currencies", async () => `${expect(await call("GET", "/currencies")).data.length}`);
await check("GET /translations/en", async () => `${Object.keys(expect(await call("GET", "/translations/en")).data.translations).length} keys`);
await check("GET /config", async () => Object.keys(expect(await call("GET", "/config")).data.settings).join(","));
await check("GET /home", async () => {
  const d = expect(await call("GET", "/home")).data;
  return `${d.sliders.length} sliders, ${d.categories.length} cats, ${d.featured_sections.length} sections`;
});
await check("GET /sliders", async () => `${expect(await call("GET", "/sliders")).data.length}`);
await check("GET /featured-sections", async () => `${expect(await call("GET", "/featured-sections")).data.length}`);
await check("GET /ads", async () => {
  const r = expect(await call("GET", "/ads"));
  ctx.publicAd = r.data[0];
  assert(r.meta?.pagination, "missing pagination");
  return `${r.meta.pagination.total} ads`;
});
await check("GET /ads (filters+sort)", async () => {
  const r = expect(await call("GET", "/ads", { query: { q: ctx.publicAd.title.split(" ")[0], sort: "price_desc", price_min: 0 } }));
  assert(r.data.length >= 1, "search returned nothing");
  return `${r.data.length} hits`;
});
await check("GET /ads?category_slug (parent includes children)", async () => {
  const slug = ctx.publicAd.category?.slug;
  return `${expect(await call("GET", "/ads", { query: { category_slug: slug } })).data.length}`;
});
await check("GET /ads/nearby", async () => `${expect(await call("GET", "/ads/nearby", { query: { latitude: 23.24, longitude: 69.66, radius: 500 } })).data.length}`);
await check("GET /ads/:slug", async () => {
  const d = expect(await call("GET", `/ads/${ctx.publicAd.slug}`)).data;
  assert(d.views_count >= 1 && d.seller && d.category, "missing relations");
  return `${d.title} (${d.views_count} views)`;
});
await check("GET /ads/:slug/related", async () => `${expect(await call("GET", `/ads/${ctx.publicAd.slug}/related`)).data.length}`);
await check("GET /ads/:slug (404)", async () => expect(await call("GET", "/ads/does-not-exist-xyz"), 404).message);
await check("GET /sellers/:id", async () => expect(await call("GET", `/sellers/${ctx.publicAd.seller.id}`)).data.seller.name);
await check("GET /sellers/:id/ads", async () => `${expect(await call("GET", `/sellers/${ctx.publicAd.seller.id}/ads`)).data.length}`);
await check("GET /sellers/:id/reviews", async () => `${expect(await call("GET", `/sellers/${ctx.publicAd.seller.id}/reviews`)).data.length}`);
await check("GET /packages", async () => {
  const r = expect(await call("GET", "/packages"));
  ctx.pkg = r.data.find((p) => p.final_price > 0) ?? r.data[0];
  return `${r.data.length}`;
});
await check("GET /packages/:id", async () => expect(await call("GET", `/packages/${ctx.pkg.id}`)).data.name);
await check("GET /featured-plans", async () => {
  const r = expect(await call("GET", "/featured-plans"));
  ctx.plan = r.data[0];
  return `${r.data.length}`;
});
await check("GET /payment-gateways", async () => expect(await call("GET", "/payment-gateways")).data.map((g) => g.code).join(","));
await check("GET /blog", async () => {
  const r = expect(await call("GET", "/blog"));
  ctx.post = r.data[0];
  return `${r.data.length}`;
});
await check("GET /blog/categories", async () => `${expect(await call("GET", "/blog/categories")).data.length}`);
await check("GET /blog/:slug", async () => (ctx.post ? expect(await call("GET", `/blog/${ctx.post.slug}`)).data.title : "no posts"));
await check("GET /pages", async () => {
  const r = expect(await call("GET", "/pages"));
  ctx.page = r.data[0];
  return `${r.data.length}`;
});
await check("GET /pages/:key", async () => expect(await call("GET", `/pages/${ctx.page.key}`)).data.title);
await check("GET /jobs", async () => {
  const r = expect(await call("GET", "/jobs"));
  ctx.job = r.data[0];
  return `${r.data.length}`;
});
await check("GET /jobs/:slug", async () => (ctx.job ? expect(await call("GET", `/jobs/${ctx.job.slug}`)).data.title : "none"));
await check("GET /seo?route=home", async () => expect(await call("GET", "/seo", { query: { route: "home" } })).data.title);
await check("GET /seo?type=ad", async () => expect(await call("GET", "/seo", { query: { type: "ad", slug: ctx.publicAd.slug } })).data.title);
await check("GET /tips", async () => `${expect(await call("GET", "/tips")).data.length}`);
await check("GET /faqs", async () => `${expect(await call("GET", "/faqs")).data.length}`);
await check("GET /report-reasons", async () => `${expect(await call("GET", "/report-reasons")).data.length}`);
await check("GET /chat-templates", async () => `${expect(await call("GET", "/chat-templates")).data.length}`);
await check("POST /contact", async () => expect(await call("POST", "/contact", { body: { name: "QA Bot", email: "qa@example.org", subject: `QA ${stamp}`, message: "Automated QA contact message." } }), 201).message);

// ---------------- auth ----------------
const email = `qa_${stamp}@classiadshub-qa.dev`;
await check("POST /auth/register (validation)", async () => expect(await call("POST", "/auth/register", { body: { name: "x" } }), 422).message);
await check("POST /auth/register", async () => {
  const r = expect(await call("POST", "/auth/register", { body: { name: "QA Buyer", email, password: "Passw0rd!", password_confirmation: "Passw0rd!" } }), 201);
  ctx.otp = r.data.otp?.debug_code;
  ctx.newUser = r.data.user;
  assert(r.data.auth_email === email, "auth_email mismatch");
  return `user #${r.data.user.id}`;
});
await check("POST /auth/register (duplicate)", async () => expect(await call("POST", "/auth/register", { body: { name: "QA", email, password: "Passw0rd!", password_confirmation: "Passw0rd!" } }), 422).message);
await check("POST /auth/login (wrong password)", async () => expect(await call("POST", "/auth/login", { body: { login: email, password: "nope-nope" } }), 422).message);
await check("POST /auth/login", async () => expect(await call("POST", "/auth/login", { body: { login: email, password: "Passw0rd!" } })).data.auth_email);
await check("Firebase sign-in (new user)", async () => {
  ctx.buyerToken = await signIn(email, "Passw0rd!");
  return "ID token issued";
});
await check("POST /auth/otp/verify", async () => expect(await call("POST", "/auth/otp/verify", { body: { identifier: email, purpose: "register", code: ctx.otp } })).data.verified);
await check("GET /auth/me", async () => {
  const d = expect(await call("GET", "/auth/me", { token: ctx.buyerToken })).data;
  assert(d.email_verified, "email not verified after OTP");
  return d.name;
});
await check("GET /auth/me (no token)", async () => expect(await call("GET", "/auth/me"), 401).message);
await check("PUT /auth/profile", async () => expect(await call("PUT", "/auth/profile", { token: ctx.buyerToken, body: { name: "QA Buyer Updated", address: "QA street 1" } })).data.name);
await check("PUT /auth/profile (avatar upload)", async () => {
  const f = new FormData();
  f.append("avatar", imageBlob(), "a.png");
  const d = expect(await call("PUT", "/auth/profile", { token: ctx.buyerToken, form: f })).data;
  assert(d.avatar_path?.startsWith("https://"), "no avatar url");
  return "uploaded";
});
await check("POST /auth/devices", async () => expect(await call("POST", "/auth/devices", { token: ctx.buyerToken, body: { fcm_token: `qa-token-${stamp}`, platform: "web" } })).data.device_id);
await check("POST /auth/password/forgot", async () => {
  const r = expect(await call("POST", "/auth/password/forgot", { body: { login: email } }));
  ctx.resetCode = r.data.debug_code;
  return "code issued";
});
await check("POST /auth/password/reset", async () => expect(await call("POST", "/auth/password/reset", { body: { login: email, code: ctx.resetCode, password: "NewPassw0rd!", password_confirmation: "NewPassw0rd!" } })).message);
await check("Firebase sign-in (new password)", async () => {
  ctx.buyerToken = await signIn(email, "NewPassw0rd!");
  return "ok";
});

await check("Firebase sign-in (seller / admin)", async () => {
  ctx.sellerToken = await signIn("seller@classiads.test", "password");
  ctx.adminToken = await signIn("admin@classiads.test", "password");
  return "ok";
});

// ---------------- ads (seller) ----------------
await check("POST /ads (validation)", async () => expect(await call("POST", "/ads", { token: ctx.sellerToken, body: { title: "x" } }), 422).message);
await check("POST /ads (multipart + image)", async () => {
  const fields = await call("GET", `/categories/${ctx.category.id}/custom-fields`);
  const f = new FormData();
  f.append("category_id", String(ctx.category.id));
  f.append("title", `QA Test Ad ${stamp}`);
  f.append("description", "Automated QA advertisement with enough description text.");
  f.append("price", "1234.50");
  f.append("price_type", "negotiable");
  f.append("condition", "used");
  if (ctx.country) f.append("country_id", String(ctx.country.id));
  if (ctx.city) f.append("city_id", String(ctx.city.id));
  f.append("latitude", "23.24");
  f.append("longitude", "69.66");
  const cf = {};
  for (const fld of fields.data ?? []) if (fld.is_required) cf[fld.code] = fld.options?.[0]?.value ?? (fld.type === "number" ? 1 : "QA");
  f.append("custom_fields", JSON.stringify(cf));
  f.append("images[]", imageBlob(), "one.png");
  const r = expect(await call("POST", "/ads", { token: ctx.sellerToken, form: f }), 201);
  ctx.ad = r.data;
  assert(r.data.images.length === 1 && r.data.price === 123450, "image/price wrong");
  return `#${r.data.id} ${r.data.status}`;
});
await check("GET /my/ads", async () => `${expect(await call("GET", "/my/ads", { token: ctx.sellerToken })).meta.pagination.total}`);
await check("PUT /ads/:id", async () => expect(await call("PUT", `/ads/${ctx.ad.id}`, { token: ctx.sellerToken, body: { title: `QA Test Ad ${stamp} edited` } })).data.title);
await check("PUT /ads/:id (not owner → 403)", async () => expect(await call("PUT", `/ads/${ctx.ad.id}`, { token: ctx.buyerToken, body: { title: "hijack" } }), 403).message);
await check("POST /ads/:id/images", async () => {
  const f = new FormData();
  f.append("images[]", imageBlob(), "two.png");
  const r = expect(await call("POST", `/ads/${ctx.ad.id}/images`, { token: ctx.sellerToken, form: f }), 201);
  ctx.img2 = r.data[0];
  return `${r.data.length} added`;
});
await check("POST /ads/:id/images/:img/primary", async () => expect(await call("POST", `/ads/${ctx.ad.id}/images/${ctx.img2.id}/primary`, { token: ctx.sellerToken })).message);
await check("DELETE /ads/:id/images/:img", async () => expect(await call("DELETE", `/ads/${ctx.ad.id}/images/${ctx.img2.id}`, { token: ctx.sellerToken })).message);

// ---------------- admin moderation of the new ad ----------------
await check("GET /admin/ping (customer → 403)", async () => expect(await call("GET", "/admin/ping", { token: ctx.buyerToken }), 403).message);
await check("GET /admin/me", async () => `${expect(await call("GET", "/admin/me", { token: ctx.adminToken })).data.permissions.length} permissions`);
await check("GET /admin/dashboard", async () => {
  const d = expect(await call("GET", "/admin/dashboard", { token: ctx.adminToken })).data;
  return `ads=${d.kpis.total_ads} users=${d.kpis.total_users} revenue=${d.kpis.total_revenue_display}`;
});
await check("GET /admin/ads?tab=requested", async () => `${expect(await call("GET", "/admin/ads", { token: ctx.adminToken, query: { tab: "requested" } })).meta.pagination.total}`);
await check("POST /admin/ads/:id/reject", async () => expect(await call("POST", `/admin/ads/${ctx.ad.id}/reject`, { token: ctx.adminToken, body: { reason: "QA reject" } })).data.status);
await check("POST /admin/ads/:id/approve", async () => expect(await call("POST", `/admin/ads/${ctx.ad.id}/approve`, { token: ctx.adminToken })).data.status);
await check("POST /admin/ads/:id/feature", async () => String(expect(await call("POST", `/admin/ads/${ctx.ad.id}/feature`, { token: ctx.adminToken })).data.is_featured));
await check("POST /admin/ads/bulk-status", async () => expect(await call("POST", "/admin/ads/bulk-status", { token: ctx.adminToken, body: { ids: [ctx.ad.id], status: "approved" } })).message);
await check("GET /ads/:slug (now public)", async () => expect(await call("GET", `/ads/${ctx.ad.slug}`)).data.status);

// ---------------- buyer interactions ----------------
await check("POST /ads/:id/favorite (add)", async () => String(expect(await call("POST", `/ads/${ctx.ad.id}/favorite`, { token: ctx.buyerToken })).data.favorited));
await check("GET /favorites", async () => `${expect(await call("GET", "/favorites", { token: ctx.buyerToken })).data.length}`);
await check("GET /ads (is_favorited for viewer)", async () => {
  const r = expect(await call("GET", `/ads/${ctx.ad.slug}`, { token: ctx.buyerToken }));
  assert(r.data.is_favorited === true, "is_favorited false");
  return "true";
});
await check("POST /ads/:id/favorite (remove)", async () => String(expect(await call("POST", `/ads/${ctx.ad.id}/favorite`, { token: ctx.buyerToken })).data.favorited));
await check("POST /saved-searches", async () => {
  ctx.search = expect(await call("POST", "/saved-searches", { token: ctx.buyerToken, body: { name: "QA", query: { q: "QA" } } }), 201).data;
  return `#${ctx.search.id}`;
});
await check("GET /saved-searches", async () => `${expect(await call("GET", "/saved-searches", { token: ctx.buyerToken })).data.length}`);
await check("POST /saved-searches/:id/run", async () => `${expect(await call("POST", `/saved-searches/${ctx.search.id}/run`, { token: ctx.buyerToken })).data.length} results`);
await check("DELETE /saved-searches/:id", async () => expect(await call("DELETE", `/saved-searches/${ctx.search.id}`, { token: ctx.buyerToken })).message);
await check("POST /conversations (own ad → 422)", async () => expect(await call("POST", "/conversations", { token: ctx.sellerToken, body: { ad_id: ctx.ad.id } }), 422).message);
await check("POST /conversations", async () => {
  ctx.convo = expect(await call("POST", "/conversations", { token: ctx.buyerToken, body: { ad_id: ctx.ad.id, message: "Hi, is this available?" } }), 201).data;
  return `#${ctx.convo.id} role=${ctx.convo.role}`;
});
await check("POST /conversations/:id/messages (seller)", async () => expect(await call("POST", `/conversations/${ctx.convo.id}/messages`, { token: ctx.sellerToken, body: { body: "Yes it is!" } }), 201).data.body);
await check("GET /conversations (buyer, unread)", async () => {
  const r = expect(await call("GET", "/conversations", { token: ctx.buyerToken }));
  const c = r.data.find((x) => x.id === ctx.convo.id);
  assert(c?.unread_count === 1, `unread=${c?.unread_count}`);
  return "unread=1";
});
await check("GET /conversations/:id", async () => `${expect(await call("GET", `/conversations/${ctx.convo.id}`, { token: ctx.buyerToken })).data.messages.length} msgs`);
await check("POST /conversations/:id/read", async () => expect(await call("POST", `/conversations/${ctx.convo.id}/read`, { token: ctx.buyerToken })).message);
await check("GET /conversations/:id (outsider → 403)", async () => expect(await call("GET", `/conversations/${ctx.convo.id}`, { token: ctx.adminToken }), 403).message);
await check("POST /offers", async () => {
  ctx.offer = expect(await call("POST", "/offers", { token: ctx.buyerToken, body: { ad_id: ctx.ad.id, amount: 1000 } }), 201).data;
  return ctx.offer.amount_display;
});
await check("POST /offers/:id/counter (seller)", async () => {
  ctx.counter = expect(await call("POST", `/offers/${ctx.offer.id}/counter`, { token: ctx.sellerToken, body: { amount: 1100 } }), 201).data;
  return ctx.counter.amount_display;
});
await check("POST /offers/:id/accept (stale → 422)", async () => expect(await call("POST", `/offers/${ctx.offer.id}/accept`, { token: ctx.sellerToken }), 422).message);
await check("POST /offers/:id/accept (buyer → 403)", async () => expect(await call("POST", `/offers/${ctx.counter.id}/accept`, { token: ctx.buyerToken }), 403).message);
await check("POST /offers/:id/accept", async () => expect(await call("POST", `/offers/${ctx.counter.id}/accept`, { token: ctx.sellerToken })).data.status);
await check("POST /offers (2nd) + withdraw", async () => {
  const o = expect(await call("POST", "/offers", { token: ctx.buyerToken, body: { ad_id: ctx.ad.id, amount: 900 } }), 201).data;
  return expect(await call("POST", `/offers/${o.id}/withdraw`, { token: ctx.buyerToken })).data.status;
});
await check("POST /offers (3rd) + reject", async () => {
  const o = expect(await call("POST", "/offers", { token: ctx.buyerToken, body: { ad_id: ctx.ad.id, amount: 800 } }), 201).data;
  return expect(await call("POST", `/offers/${o.id}/reject`, { token: ctx.sellerToken })).data.status;
});
await check("GET /offers", async () => `${expect(await call("GET", "/offers", { token: ctx.buyerToken })).data.length}`);
await check("POST /sellers/:id/follow", async () => String(expect(await call("POST", `/sellers/${ctx.ad.seller.id}/follow`, { token: ctx.buyerToken })).data.following));
await check("GET /following", async () => `${expect(await call("GET", "/following", { token: ctx.buyerToken })).data.length}`);
await check("GET /followers (seller)", async () => `${expect(await call("GET", "/followers", { token: ctx.sellerToken })).data.length}`);
await check("GET /sellers/:id (is_following)", async () => String(expect(await call("GET", `/sellers/${ctx.ad.seller.id}`, { token: ctx.buyerToken })).data.is_following));
await check("POST /sellers/:id/follow (unfollow)", async () => String(expect(await call("POST", `/sellers/${ctx.ad.seller.id}/follow`, { token: ctx.buyerToken })).data.following));
await check("GET /ads/:id/potential-buyers", async () => `${expect(await call("GET", `/ads/${ctx.ad.id}/potential-buyers`, { token: ctx.sellerToken })).data.length}`);
await check("POST /reviews (seller_review)", async () => {
  ctx.review = expect(await call("POST", "/reviews", { token: ctx.buyerToken, body: { reviewee_id: ctx.ad.seller.id, ad_id: ctx.ad.id, rating: 5, comment: "QA great seller", type: "seller_review" } }), 201).data;
  return `#${ctx.review.id}`;
});
await check("POST /reviews (buyer_review before sale → 422)", async () => expect(await call("POST", "/reviews", { token: ctx.sellerToken, body: { reviewee_id: ctx.newUser.id, ad_id: ctx.ad.id, rating: 4, type: "buyer_review" } }), 422).message);
await check("POST /ads/:id/confirm-buyer", async () => expect(await call("POST", `/ads/${ctx.ad.id}/confirm-buyer`, { token: ctx.sellerToken, body: { buyer_id: ctx.newUser.id } })).data.status);
await check("POST /reviews (buyer_review after sale)", async () => expect(await call("POST", "/reviews", { token: ctx.sellerToken, body: { reviewee_id: ctx.newUser.id, ad_id: ctx.ad.id, rating: 4, type: "buyer_review" } }), 201).data.rating);
await check("GET /reviews/mine", async () => `${expect(await call("GET", "/reviews/mine", { token: ctx.buyerToken })).data.length}`);
await check("GET /reviews/received", async () => `${expect(await call("GET", "/reviews/received", { token: ctx.sellerToken })).data.length}`);
await check("POST /reviews/:id/report", async () => expect(await call("POST", `/reviews/${ctx.review.id}/report`, { token: ctx.sellerToken, body: { reason: "QA report" } })).message);
await check("POST /reports", async () => {
  ctx.report = expect(await call("POST", "/reports", { token: ctx.buyerToken, body: { type: "ad", id: ctx.ad.id, reason: "Fake Items" } }), 201).data;
  return `#${ctx.report.report_id}`;
});
await check("GET /notifications", async () => {
  const r = expect(await call("GET", "/notifications", { token: ctx.sellerToken }));
  ctx.notif = r.data[0];
  return `${r.data.length} (unread ${r.meta.unread_count})`;
});
await check("GET /notifications/unread-count", async () => `${expect(await call("GET", "/notifications/unread-count", { token: ctx.sellerToken })).data.unread_count}`);
await check("POST /notifications/:id/read", async () => expect(await call("POST", `/notifications/${ctx.notif.id}/read`, { token: ctx.sellerToken })).message);
await check("POST /notifications/read-all", async () => expect(await call("POST", "/notifications/read-all", { token: ctx.sellerToken })).message);

// ---------------- billing ----------------
await check("POST /subscriptions/checkout (sandbox)", async () => {
  const d = expect(await call("POST", "/subscriptions/checkout", { token: ctx.buyerToken, body: { package_id: ctx.pkg.id, gateway: "sandbox" } }), 201).data;
  ctx.txn = d.transaction;
  return `${d.transaction.total_display} ${d.payment.status}`;
});
await check("POST /payments/:id/confirm", async () => {
  const d = expect(await call("POST", `/payments/${ctx.txn.id}/confirm`, { token: ctx.buyerToken })).data;
  assert(d.status === "completed" && d.invoice, "not completed / no invoice");
  ctx.invoiceId = d.invoice.id;
  return d.invoice.number;
});
await check("GET /subscriptions/active", async () => expect(await call("GET", "/subscriptions/active", { token: ctx.buyerToken })).data?.package?.name ?? "none");
await check("GET /subscriptions", async () => `${expect(await call("GET", "/subscriptions", { token: ctx.buyerToken })).data.length}`);
await check("GET /transactions", async () => `${expect(await call("GET", "/transactions", { token: ctx.buyerToken })).data.length}`);
await check("GET /payments/:id", async () => expect(await call("GET", `/payments/${ctx.txn.id}`, { token: ctx.buyerToken })).data.status);
await check("GET /invoices", async () => `${expect(await call("GET", "/invoices", { token: ctx.buyerToken })).data.length}`);
await check("GET /invoices/:id", async () => expect(await call("GET", `/invoices/${ctx.invoiceId}`, { token: ctx.buyerToken })).data.number);
await check("POST /ads/:id/feature/checkout (bank transfer)", async () => {
  const d = expect(await call("POST", `/ads/${ctx.ad.id}/feature/checkout`, { token: ctx.sellerToken, body: { plan_id: ctx.plan.id, gateway: "bank_transfer" } }), 201).data;
  ctx.btTxn = d.transaction;
  return d.payment.reference;
});
await check("POST /payments/:id/confirm (manual → 422)", async () => expect(await call("POST", `/payments/${ctx.btTxn.id}/confirm`, { token: ctx.sellerToken }), 422).message);
await check("POST /payments/:id/receipt", async () => {
  const f = new FormData();
  f.append("receipt", imageBlob(), "r.png");
  return expect(await call("POST", `/payments/${ctx.btTxn.id}/receipt`, { token: ctx.sellerToken, form: f })).data.receipt_url ? "uploaded" : "no url";
});
await check("POST /admin/transactions/:id/confirm (bank transfer)", async () => expect(await call("POST", `/admin/transactions/${ctx.btTxn.id}/confirm`, { token: ctx.adminToken })).data.status);
await check("POST /webhooks/payments/sandbox", async () => {
  const d = expect(await call("POST", "/subscriptions/checkout", { token: ctx.buyerToken, body: { package_id: ctx.pkg.id, gateway: "sandbox" } }), 201).data;
  return expect(await call("POST", "/webhooks/payments/sandbox", { body: { transaction_id: d.transaction.id, status: "failed" } })).data.status;
});

// ---------------- verification + jobs ----------------
await check("POST /verification", async () => {
  const f = new FormData();
  f.append("document_type", "id_card");
  f.append("document_number", "QA-123");
  f.append("front_image", imageBlob(), "front.png");
  ctx.kyc = expect(await call("POST", "/verification", { token: ctx.buyerToken, form: f }), 201).data;
  return ctx.kyc.status;
});
await check("POST /verification (duplicate → 422)", async () => {
  const f = new FormData();
  f.append("document_type", "id_card");
  f.append("front_image", imageBlob(), "front.png");
  return expect(await call("POST", "/verification", { token: ctx.buyerToken, form: f }), 422).message;
});
await check("GET /verification", async () => expect(await call("GET", "/verification", { token: ctx.buyerToken })).data.request.status);
await check("GET /admin/verifications", async () => `${expect(await call("GET", "/admin/verifications", { token: ctx.adminToken, query: { status: "pending" } })).data.length}`);
await check("POST /admin/verifications/:id/approve", async () => expect(await call("POST", `/admin/verifications/${ctx.kyc.id}/approve`, { token: ctx.adminToken })).data.status);
await check("POST /jobs", async () => {
  ctx.newJob = expect(await call("POST", "/jobs", { token: ctx.sellerToken, body: { title: `QA Job ${stamp}`, description: "Automated QA job description.", employment_type: "full_time", salary_min: 1000, salary_max: 2000, currency_code: "USD" } }), 201).data;
  return ctx.newJob.salary_display;
});
await check("PUT /jobs/:id", async () => expect(await call("PUT", `/jobs/${ctx.newJob.id}`, { token: ctx.sellerToken, body: { company_name: "QA Corp" } })).data.company_name);
await check("POST /jobs/:id/apply", async () => {
  ctx.app = expect(await call("POST", `/jobs/${ctx.newJob.id}/apply`, { token: ctx.buyerToken, body: { cover_letter: "Hire me" } }), 201).data;
  return ctx.app.status;
});
await check("POST /jobs/:id/apply (again → 422)", async () => expect(await call("POST", `/jobs/${ctx.newJob.id}/apply`, { token: ctx.buyerToken, body: {} }), 422).message);
await check("GET /jobs/:id/applications", async () => `${expect(await call("GET", `/jobs/${ctx.newJob.id}/applications`, { token: ctx.sellerToken })).data.length}`);
await check("POST /jobs/:id/applications/:app/status", async () => expect(await call("POST", `/jobs/${ctx.newJob.id}/applications/${ctx.app.id}/status`, { token: ctx.sellerToken, body: { status: "shortlisted" } })).data.status);
await check("GET /my/jobs", async () => `${expect(await call("GET", "/my/jobs", { token: ctx.sellerToken })).data.length}`);
await check("GET /my/applications", async () => `${expect(await call("GET", "/my/applications", { token: ctx.buyerToken })).data.length}`);

// ---------------- admin modules ----------------
const A = { token: ctx.adminToken };
const crud = [
  ["categories", { name: `QA Cat ${stamp}`, parent_id: ctx.category.parent_id ?? null }],
  ["custom_fields", { name: `QA Field ${stamp}`, type: "dropdown", options: ["A", "B"], category_ids: [ctx.category.id] }],
  ["countries", { name: `QA Land ${stamp}`, iso2: "QZ" }],
  ["currencies", { code: "QAX", name: "QA Dollar", symbol: "Q$", symbol_position: "left" }],
  ["languages", { name: "QA Lang", code: `q${stamp.slice(-3)}` }],
  ["faqs", { question: "QA?", answer: "Yes." }],
  ["report_reasons", { reason: "QA reason" }],
  ["tips", { description: "QA tip" }],
  ["chat_templates", { name: "QA template", messages: ["Hi"], replies: ["Hello"] }],
  ["banner_ads", { platform: "app", page: "home", layout: "single", ad_type: "external", external_url: "https://example.org" }],
  ["verification_fields", { name: "QA field", type: "textbox" }],
  ["blog_categories", { name: `QA Blog Cat ${stamp}` }],
  ["featured_ad_plans", { name: "QA plan", price: 9.99, duration_days: 7 }],
  ["email_templates", { code: `qa_${stamp}`, subject: "QA", body_html: "<p>QA</p>" }],
  ["roles", { name: `QA Role ${stamp}`, permissions: ["ads", "chat"] }],
  ["pages", { key: `qa-${stamp}`, title: "QA page", body: "<p>QA</p>" }],
  ["seo_meta", { route_key: `qa-${stamp}`, title: "QA SEO" }],
  ["featured_sections", { title: "QA Section", filter_type: "latest", item_limit: 4 }],
  ["packages", { name: "QA Package", price: 10, discount_percent: 10, duration_days: 30, ad_limit: 5, type: "ad_listing" }],
];
for (const [resource, body] of crud) {
  await check(`ADMIN crud ${resource} (create/list/update/delete)`, async () => {
    const created = expect(await call("POST", `/admin/crud/${resource}`, { ...A, body }), 201).data;
    expect(await call("GET", `/admin/crud/${resource}`, A));
    expect(await call("PUT", `/admin/crud/${resource}/${created.id}`, { ...A, body: { is_active: false } }));
    expect(await call("DELETE", `/admin/crud/${resource}/${created.id}`, A));
    return `#${created.id}`;
  });
}
await check("ADMIN crud states/cities/areas chain", async () => {
  const st = expect(await call("POST", "/admin/crud/states", { ...A, body: { name: "QA State", country_id: ctx.country.id } }), 201).data;
  const ci = expect(await call("POST", "/admin/crud/cities", { ...A, body: { name: "QA City", country_id: ctx.country.id, state_id: st.id, latitude: 1, longitude: 2 } }), 201).data;
  const ar = expect(await call("POST", "/admin/crud/areas", { ...A, body: { name: "QA Area", country_id: ctx.country.id, state_id: st.id, city_id: ci.id } }), 201).data;
  await call("DELETE", `/admin/crud/areas/${ar.id}`, A);
  await call("DELETE", `/admin/crud/cities/${ci.id}`, A);
  await call("DELETE", `/admin/crud/states/${st.id}`, A);
  return "ok";
});
await check("ADMIN crud sliders (image upload)", async () => {
  const f = new FormData();
  f.append("image", imageBlob(), "s.png");
  f.append("title", "QA slider");
  f.append("external_url", "https://example.org");
  const s = expect(await call("POST", "/admin/crud/sliders", { ...A, form: f }), 201).data;
  assert(s.image_url, "no image url");
  expect(await call("DELETE", `/admin/crud/sliders/${s.id}`, A));
  return "ok";
});
await check("ADMIN crud reorder", async () => {
  const cats = expect(await call("GET", "/admin/crud/tips", { ...A, query: { all: 1 } })).data;
  return expect(await call("POST", "/admin/crud/tips/reorder", { ...A, body: { ids: cats.map((c) => c.id).reverse() } })).message;
});
await check("ADMIN crud user_queries (read-only)", async () => {
  expect(await call("GET", "/admin/crud/user_queries", A));
  return expect(await call("POST", "/admin/crud/user_queries", { ...A, body: {} }), 405).message;
});
await check("ADMIN users list/show/status/auto-approve", async () => {
  const r = expect(await call("GET", "/admin/users", { ...A, query: { customers: 1, q: "QA" } }));
  expect(await call("GET", `/admin/users/${ctx.newUser.id}`, A));
  expect(await call("POST", `/admin/users/${ctx.newUser.id}/auto-approve`, { ...A, body: { enabled: true } }));
  expect(await call("POST", `/admin/users/${ctx.newUser.id}/status`, { ...A, body: { status: "suspended" } }));
  expect(await call("POST", `/admin/users/${ctx.newUser.id}/status`, { ...A, body: { status: "active" } }));
  return `${r.data.length} matched`;
});
await check("ADMIN users assign/remove package", async () => {
  expect(await call("POST", `/admin/users/${ctx.newUser.id}/packages`, { ...A, body: { package_id: ctx.pkg.id } }), 201);
  return `${expect(await call("DELETE", `/admin/users/${ctx.newUser.id}/packages`, A)).data.cancelled} cancelled`;
});
await check("ADMIN staff create/update/delete", async () => {
  const s = expect(await call("POST", "/admin/staff", { ...A, body: { name: "QA Staff", email: `staff_${stamp}@classiadshub-qa.dev`, password: "StaffPass1!", role: "staff" } }), 201).data;
  expect(await call("GET", "/admin/staff", A));
  expect(await call("PUT", `/admin/staff/${s.id}`, { ...A, body: { name: "QA Staff 2" } }));
  const staffToken = await signIn(`staff_${stamp}@classiadshub-qa.dev`, "StaffPass1!");
  expect(await call("GET", "/admin/ads", { token: staffToken }));
  expect(await call("GET", "/admin/settings", { token: staffToken }), 403);
  expect(await call("DELETE", `/admin/staff/${s.id}`, A));
  ctx.staffId = s.id;
  ctx.staffToken = staffToken;
  return "staff scoped ok";
});
await check("ADMIN staff removal deletes the account (no orphan, old token rejected)", async () => {
  expect(await call("GET", `/admin/users/${ctx.staffId}`, A), 404);
  const r = await call("GET", "/admin/ads", { token: ctx.staffToken });
  assert(r.status === 401, `old staff token got HTTP ${r.status}`);
  const relogin = await signIn(`staff_${stamp}@classiadshub-qa.dev`, "StaffPass1!").then(() => "signed in", () => "rejected");
  assert(relogin === "rejected", "deleted staff can still sign in");
  return "deleted";
});
await check("ADMIN custom role restricts staff (no inheritance from the \"staff\" role)", async () => {
  const role = expect(await call("POST", "/admin/crud/roles", { ...A, body: { name: `qa-content-${stamp}`, permissions: ["dashboard", "content"] } }), 201).data;
  const email = `staff2_${stamp}@classiadshub-qa.dev`;
  const s = expect(await call("POST", "/admin/staff", { ...A, body: { name: "QA Content Staff", email, password: "StaffPass1!", role: role.name } }), 201).data;
  try {
    const t = await signIn(email, "StaffPass1!");
    const perms = expect(await call("GET", "/admin/me", { token: t })).data.permissions.sort().join(",");
    assert(perms === "content,dashboard", `permissions ${perms}`);
    expect(await call("GET", "/admin/crud/sliders", { token: t }));
    expect(await call("GET", "/admin/crud/categories", { token: t })); // lookup for content pages
    expect(await call("POST", "/admin/crud/categories", { token: t, body: { name: "x" } }), 403);
    expect(await call("GET", "/admin/users", { token: t }), 403);
    expect(await call("GET", "/admin/ads", { token: t })); // approved-ads lookup (slider/banner pickers)
    expect(await call("GET", "/admin/reports", { token: t }), 403);
    expect(await call("GET", "/admin/settings", { token: t, query: { group: "home" } })); // Home Screen is a content page
    expect(await call("GET", "/admin/settings", { token: t }), 403);
    expect(await call("PUT", "/admin/settings", { token: t, body: { group: "general", settings: { app_name: "x" } } }), 403);
    return perms;
  } finally {
    await call("DELETE", `/admin/staff/${s.id}`, A);
    await call("DELETE", `/admin/crud/roles/${role.id}`, A);
  }
});
await check("ADMIN unknown ids → 404 (no ghost documents)", async () => {
  expect(await call("POST", "/admin/users/987654/auto-approve", { ...A, body: { enabled: true } }), 404);
  expect(await call("POST", "/admin/jobs/987654/status", { ...A, body: { status: "closed" } }), 404);
  expect(await call("POST", "/admin/subscriptions/987654/cancel", A), 404);
  expect(await call("PUT", "/admin/payment-gateways/987654", { ...A, body: { is_active: false } }), 404);
  expect(await call("POST", "/admin/crud/tips/reorder", { ...A, body: { ids: [987654] } }));
  expect(await call("POST", "/admin/crud/tips/bulk", { ...A, body: { ids: [987654], action: "deactivate" } }));
  expect(await call("GET", "/admin/crud/tips/987654", A), 404);
  expect(await call("GET", "/admin/users/987654", A), 404);
  return "404s, nothing created";
});
await check("ADMIN categories: parent cycle → 422, bulk delete guarded", async () => {
  const p = expect(await call("POST", "/admin/crud/categories", { ...A, body: { name: `QA Parent ${stamp}` } }), 201).data;
  const c = expect(await call("POST", "/admin/crud/categories", { ...A, body: { name: `QA Child ${stamp}`, parent_id: p.id } }), 201).data;
  try {
    const self = expect(await call("PUT", `/admin/crud/categories/${p.id}`, { ...A, body: { parent_id: p.id } }), 422);
    assert(self.errors?.parent_id, "no parent_id error");
    expect(await call("PUT", `/admin/crud/categories/${p.id}`, { ...A, body: { parent_id: c.id } }), 422);
    expect(await call("POST", "/admin/crud/categories", { ...A, body: { name: "QA orphan", parent_id: 987654 } }), 422);
    expect(await call("POST", "/admin/crud/categories/bulk", { ...A, body: { ids: [p.id], action: "delete" } }), 422);
    expect(await call("GET", `/admin/crud/categories/${p.id}`, A));
  } finally {
    await call("DELETE", `/admin/crud/categories/${c.id}`, A);
    await call("DELETE", `/admin/crud/categories/${p.id}`, A);
  }
  return "cycle blocked";
});
await check("GET /categories/:id/custom-fields inherits ancestor fields", async () => {
  const fields = expect(await call("GET", "/admin/crud/custom_fields", { ...A, query: { all: 1 } })).data.filter((f) => f.is_active !== false && f.category_ids?.length);
  const cats = expect(await call("GET", "/categories")).data;
  const f = fields.find((x) => cats.some((c) => Number(c.parent_id) === Number(x.category_ids[0])));
  if (!f) return "no parent-level field (skipped)";
  const child = cats.find((c) => Number(c.parent_id) === Number(f.category_ids[0]));
  const got = expect(await call("GET", `/categories/${child.id}/custom-fields`)).data;
  assert(got.some((x) => x.id === f.id), `${child.name} lacks inherited field ${f.name}`);
  return `${child.name} ← ${f.name}`;
});
await check("GET /banner-ads returns image URLs", async () => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ platform: "web", page: "home", layout: "single", ad_type: "external", external_url: "https://example.org" })) f.append(k, v);
  f.append("images[]", imageBlob(), "b.png");
  const b = expect(await call("POST", "/admin/crud/banner_ads", { ...A, form: f }), 201).data;
  try {
    const pub = expect(await call("GET", "/banner-ads", { query: { platform: "web", page: "home" } })).data;
    const mine = pub.find((x) => x.id === b.id);
    assert(!mine || String(mine.image_urls?.[0] ?? "").startsWith("https://"), `bad shape ${JSON.stringify(mine)}`);
    assert(pub.every((x) => Array.isArray(x.image_urls) && !("image_paths" in x)), "raw image_paths leaked");
    return mine ? "url ok" : "cached list (shape ok)";
  } finally {
    await call("DELETE", `/admin/crud/banner_ads/${b.id}`, A);
  }
});
await check("ADMIN chat products/conversations", async () => {
  const p = expect(await call("GET", "/admin/chat/products", A)).data;
  const c = expect(await call("GET", "/admin/conversations", { ...A, query: { ad_id: ctx.ad.id } })).data;
  const one = expect(await call("GET", `/admin/conversations/${c[0].id}`, A)).data;
  return `${p.length} products, ${one.messages.length} msgs`;
});
await check("ADMIN reviews + review report", async () => {
  const r = expect(await call("GET", "/admin/reviews", { ...A, query: { reported: 1 } })).data;
  assert(r.some((x) => x.id === ctx.review.id), "reported review missing");
  expect(await call("POST", `/admin/reviews/${ctx.review.id}/report`, { ...A, body: { decision: "rejected", reason: "Legit review" } }));
  expect(await call("POST", `/admin/reviews/${ctx.review.id}/approval`, { ...A, body: { is_approved: true } }));
  return `${r.length} reported`;
});
await check("ADMIN reports list/status", async () => {
  const r = expect(await call("GET", "/admin/reports", A)).data;
  expect(await call("POST", `/admin/reports/${ctx.report.report_id}/status`, { ...A, body: { status: "resolved" } }));
  return `${r.length}`;
});
await check("ADMIN jobs list/status", async () => {
  expect(await call("GET", "/admin/jobs", A));
  return expect(await call("POST", `/admin/jobs/${ctx.newJob.id}/status`, { ...A, body: { status: "closed" } })).message;
});
await check("ADMIN push notification send/list", async () => {
  const d = expect(await call("POST", "/admin/push-notifications", { ...A, body: { title: "QA push", body: "QA body", target: "user", target_user_id: ctx.newUser.id } }), 201).data;
  expect(await call("GET", "/admin/push-notifications", A));
  await call("DELETE", `/admin/push-notifications/${d.id}`, A);
  return `${d.recipients_count} recipient`;
});
await check("ADMIN subscriptions/transactions", async () => {
  const s = expect(await call("GET", "/admin/subscriptions", A)).meta.pagination.total;
  const t = expect(await call("GET", "/admin/transactions", { ...A, query: { gateway: "bank_transfer" } })).meta.pagination.total;
  return `${s} subs, ${t} bank transfers`;
});
await check("ADMIN refund transaction", async () => expect(await call("POST", `/admin/transactions/${ctx.btTxn.id}/refund`, A)).data.status);
await check("ADMIN payment gateways", async () => {
  const g = expect(await call("GET", "/admin/payment-gateways", A)).data;
  const bt = g.find((x) => x.code === "bank_transfer");
  return expect(await call("PUT", `/admin/payment-gateways/${bt.id}`, { ...A, body: { config: { ...(bt.config ?? {}), instructions: bt.config?.instructions ?? "Transfer to the marketplace bank account and quote your reference." } } })).data.code;
});
await check("ADMIN settings get/put", async () => {
  const s = expect(await call("GET", "/admin/settings", A)).data;
  expect(await call("PUT", "/admin/settings", { ...A, body: { group: "home", settings: { show_slider: s.home?.show_slider ?? true } } }));
  return `${Object.keys(s).length} groups`;
});
await check("ADMIN translations get/put", async () => {
  const s = expect(await call("GET", "/admin/translations/en", A)).data;
  return expect(await call("PUT", "/admin/translations/en", { ...A, body: { strings: s } })).message;
});
await check("ADMIN system status", async () => {
  const d = expect(await call("GET", "/admin/system-status", A)).data;
  assert(Object.values(d.checks).every((c) => c.ok), JSON.stringify(d.checks));
  return Object.keys(d.checks).join(",");
});
await check("ADMIN audit logs", async () => `${expect(await call("GET", "/admin/audit-logs", A)).meta.pagination.total}`);
await check("ADMIN ai generate", async () => expect(await call("POST", "/admin/ai/generate", { ...A, body: { prompt: "Red bicycle", type: "title" } })).data.provider);
await check("ADMIN blog create/update/delete", async () => {
  const f = new FormData();
  f.append("title", `QA Blog ${stamp}`);
  f.append("body", "<p>QA body content</p>");
  f.append("status", "published");
  f.append("tags", "qa,test");
  f.append("cover_image", imageBlob(), "c.png");
  const p = expect(await call("POST", "/admin/blog", { ...A, form: f }), 201).data;
  expect(await call("GET", `/blog/${p.slug}`));
  expect(await call("PUT", `/admin/blog/${p.id}`, { ...A, body: { title: `QA Blog ${stamp} v2` } }));
  expect(await call("GET", "/admin/blog", A));
  expect(await call("DELETE", `/admin/blog/${p.id}`, A));
  return "ok";
});

// ---------------- cleanup ----------------
await check("cleanup: delete QA job + ad", async () => {
  await call("DELETE", `/jobs/${ctx.newJob.id}`, { token: ctx.sellerToken });
  expect(await call("DELETE", `/admin/ads/${ctx.ad.id}`, A));
  return "ok";
});
await check("DELETE /auth/account", async () => expect(await call("DELETE", "/auth/account", { token: ctx.buyerToken, body: { password: "NewPassw0rd!" } })).message);

// ---------------- report ----------------
const pass = results.filter((r) => r.ok).length;
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(58)} ${String(r.ms).padStart(5)}ms  ${String(r.detail).slice(0, 110)}`);
console.log(`\n${pass}/${results.length} passed`);
process.exit(pass === results.length ? 0 : 1);
