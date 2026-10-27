/**
 * Full end-to-end website QA against the LIVE Firebase backend (creates and cleans up real data).
 *   node web-e2e.mjs [baseUrl] [only=phase1,phase2]
 */
import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { signIn, call } from "./lib.mjs";

const BASE = process.argv[2] ?? "http://localhost:4200";
const ONLY = (process.argv[3] ?? "").split(",").filter(Boolean);
const OUT = "./shots/web-agent";
await mkdir(OUT, { recursive: true });
const IMG1 = "../../512.png";
const IMG2 = "../../app-icon.png";

const stamp = Date.now().toString(36);
const NEW_EMAIL = `qa.web.${stamp}@classiadshub-qa.dev`;
const NEW_PW = "QaWebPass1!";
const NEW_PW2 = "QaWebPass2!";
const state = { created: [], cleanup: [] };

const results = [];
const problems = [];
let current = "";
let n = 0;

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function newCtx(tag, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);
  page.dialogAnswer = undefined;
  page.on("dialog", (d) => (d.type() === "prompt" ? d.accept(page.dialogAnswer ?? "") : d.accept()));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/favicon|DevTools|Failed to load resource/.test(t)) return;
    problems.push(`[${tag}/${current}] console: ${t.slice(0, 220)}`);
  });
  page.on("pageerror", (e) => problems.push(`[${tag}/${current}] pageerror: ${e.message.slice(0, 220)}`));
  page.on("response", (r) => {
    const u = r.url();
    if (/cloudfunctions\.net\/api|\/api\/v1/.test(u) && r.status() >= 400 && !page.expected?.(u, r.status())) {
      problems.push(`[${tag}/${current}] API ${r.status()} ${r.request().method()} ${u.replace(/^.*\/v1/, "")}`);
    }
    if (u.startsWith(BASE) && r.status() === 404) {
      if (/\.txt(\?|$)/.test(u)) state.txt404 = (state.txt404 ?? new Set()).add(u.replace(BASE, "").replace(/\?.*$/, ""));
      else problems.push(`[${tag}/${current}] 404 ${u.replace(BASE, "")}`);
    }
  });
  return { ctx, page };
}

async function step(page, name, fn) {
  current = name;
  const t = Date.now();
  try {
    const detail = await fn();
    results.push({ ok: true, name, detail: detail ?? "", ms: Date.now() - t });
    console.log(`PASS ${name} ${detail ?? ""}`);
  } catch (e) {
    results.push({ ok: false, name, detail: e.message.split("\n")[0].slice(0, 300), ms: Date.now() - t });
    console.log(`FAIL ${name} — ${e.message.split("\n")[0].slice(0, 300)}`);
  }
  await page.screenshot({ path: `${OUT}/${String(++n).padStart(3, "0")}-${name.replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 60)}.png`, fullPage: false }).catch(() => undefined);
}
const settle = async (page, ms = 600) => {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(ms);
};
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const api = async (method, path, token, body) => {
  const r = await call(method, path, { token, body });
  return r;
};
async function waitFor(fn, ms = 20000, msg = "condition") {
  const end = Date.now() + ms;
  let last;
  while (Date.now() < end) {
    last = await fn().catch((e) => (last = e, null));
    if (last) return last;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`timeout waiting for ${msg}`);
}
const run = (phase) => !ONLY.length || ONLY.includes(phase);

async function uiLogin(page, email, password) {
  await page.goto(`${BASE}/login`);
  await settle(page, 300);
  await page.getByLabel("Email or phone").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
  await page.getByRole("button", { name: "Account menu" }).waitFor({ timeout: 20000 });
}
async function uiLogout(page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("link", { name: "Login" }).first().waitFor({ timeout: 15000 });
}

const adminT = await signIn("admin@classiads.test");
const sellerT = await signIn("seller@classiads.test");
const custT = await signIn("customer@classiads.test");

// =====================================================================================
// PUBLIC
// =====================================================================================
if (run("public")) {
  const { ctx, page } = await newCtx("public", { permissions: ["geolocation"], geolocation: { latitude: 23.2419, longitude: 69.6669 } });

  await step(page, "home: sliders, categories, sections, all ads", async () => {
    await page.goto(`${BASE}/`);
    await page.waitForSelector('a[href^="/ad/"]', { timeout: 30000 });
    await settle(page);
    const home = (await api("GET", "/home")).data;
    const ads = await page.locator('a[href^="/ad/"]').count();
    const cats = await page.locator('main a[href^="/category/"]').count();
    const txt = await page.locator("main").innerText();
    assert(txt.includes("All Advertisements"), "All Advertisements section missing");
    for (const s of home.featured_sections ?? home.sections ?? []) if (s.ads?.length) assert(txt.includes(s.title), `section "${s.title}" missing`);
    const sliders = (await api("GET", "/sliders")).data ?? [];
    const imgs = await page.locator("main img").count();
    assert(cats > 0, "no category links");
    return `${ads} ad links, ${cats} category links, ${imgs} images, sliders(api)=${sliders.length ?? Object.keys(sliders).length}`;
  });

  await step(page, "search: keyword", async () => {
    await page.goto(`${BASE}/`);
    await settle(page, 300);
    await page.getByPlaceholder(/Search any advertisement/i).fill("Ford");
    await page.getByPlaceholder(/Search any advertisement/i).press("Enter");
    await page.waitForURL(/\/search\?q=Ford/);
    await settle(page, 800);
    const total = (await api("GET", "/ads?q=Ford&per_page=20")).meta.pagination.total;
    const shown = await page.getByText(/listings found/).innerText();
    assert(shown.startsWith(String(total)), `UI "${shown}" vs API ${total}`);
    assert(total > 0, "no results for Ford");
    return shown;
  });

  await step(page, "search: category filter", async () => {
    await page.goto(`${BASE}/search`);
    await settle(page);
    await page.locator("aside").getByRole("button", { name: "Cars & Vehicles" }).click();
    await page.waitForURL(/category_slug=cars-vehicles/);
    await settle(page, 800);
    const total = (await api("GET", "/ads?category_slug=cars-vehicles")).meta.pagination.total;
    const shown = await page.getByText(/listings found/).innerText();
    assert(shown.startsWith(String(total)), `UI "${shown}" vs API ${total}`);
    return shown;
  });

  await step(page, "search: price range", async () => {
    await page.goto(`${BASE}/search`);
    await settle(page);
    await page.getByPlaceholder("Min").fill("100");
    await page.getByPlaceholder("Max").fill("20000");
    await page.locator("aside").getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/price_min=100.*price_max=20000|price_max=20000.*price_min=100/);
    await settle(page, 800);
    const r = await api("GET", "/ads?price_min=100&price_max=20000&per_page=50");
    assert(r.data.every((a) => a.price >= 10000 && a.price <= 2000000), "API returned out-of-range prices");
    const shown = await page.getByText(/listings found/).innerText();
    assert(shown.startsWith(String(r.meta.pagination.total)), `UI "${shown}" vs API ${r.meta.pagination.total}`);
    return shown;
  });

  await step(page, "search: condition", async () => {
    await page.locator("aside select").selectOption("used");
    await page.waitForURL(/condition=used/);
    await settle(page, 800);
    const total = (await api("GET", "/ads?price_min=100&price_max=20000&condition=used")).meta.pagination.total;
    const shown = await page.getByText(/listings found/).innerText();
    assert(shown.startsWith(String(total)), `UI "${shown}" vs API ${total}`);
    return shown;
  });

  await step(page, "search: sort price asc/desc", async () => {
    await page.goto(`${BASE}/search`);
    await settle(page);
    const sortSel = page.locator("main select").last();
    await sortSel.selectOption("price_asc");
    await page.waitForURL(/sort=price_asc/);
    await settle(page, 800);
    const asc = (await api("GET", "/ads?sort=price_asc&per_page=20")).data;
    const firstAsc = (await page.locator('main a[href^="/ad/"]').first().getAttribute("href")) ?? "";
    assert(firstAsc.endsWith(asc[0].slug), `first card ${firstAsc} vs API ${asc[0].slug}`);
    await sortSel.selectOption("price_desc");
    await page.waitForURL(/sort=price_desc/);
    await settle(page, 800);
    const desc = (await api("GET", "/ads?sort=price_desc&per_page=20")).data;
    const firstDesc = (await page.locator('main a[href^="/ad/"]').first().getAttribute("href")) ?? "";
    assert(firstDesc.endsWith(desc[0].slug), `first card ${firstDesc} vs API ${desc[0].slug}`);
    return `asc ${asc[0].price_display}, desc ${desc[0].price_display}`;
  });

  await step(page, "search: pagination", async () => {
    const r = await api("GET", "/ads?per_page=20");
    if (r.meta.pagination.last_page < 2) {
      await page.goto(`${BASE}/search?page=1`);
      return `only ${r.meta.pagination.total} ads — single page`;
    }
    await page.goto(`${BASE}/search`);
    await settle(page);
    await page.locator("main nav").getByRole("link", { name: "2", exact: true }).click();
    await page.waitForURL(/page=2/);
    await settle(page, 800);
    const p2 = (await api("GET", "/ads?per_page=20&page=2")).data;
    const first = (await page.locator('main a[href^="/ad/"]').first().getAttribute("href")) ?? "";
    assert(first.endsWith(p2[0].slug), `page2 first ${first} vs ${p2[0].slug}`);
    return `page 2 of ${r.meta.pagination.last_page}`;
  });

  await step(page, "category page + subcategory", async () => {
    const tree = (await api("GET", "/categories/tree")).data;
    const parent = tree.find((c) => c.children?.length);
    await page.goto(`${BASE}/category/${parent.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    assert((await page.locator("main h1").innerText()).trim() === parent.name, "parent h1 mismatch");
    const child = parent.children[0];
    await page.locator(`main a[href="/category/${child.slug}"]`).first().click();
    await page.waitForURL(new RegExp(`/category/${child.slug}`));
    await page.waitForFunction((n) => document.querySelector("main h1")?.textContent?.trim() === n, child.name, { timeout: 20000 });
    await settle(page);
    const parentTotal = (await api("GET", `/ads?category_slug=${parent.slug}`)).meta.pagination.total;
    const childTotal = (await api("GET", `/ads?category_slug=${child.slug}`)).meta.pagination.total;
    return `${parent.name} (${parentTotal}) → ${child.name} (${childTotal})`;
  });

  await step(page, "ad detail: gallery, specs, seller, related", async () => {
    const list = (await api("GET", "/ads?category_slug=cars-vehicles&per_page=20")).data;
    const ad = list.find((a) => a.images?.length) ?? list[0];
    await page.goto(`${BASE}/ad/${ad.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page, 1000);
    const txt = await page.locator("main").innerText();
    assert(txt.includes(ad.title), "title missing");
    assert(txt.includes(ad.price_display), "price missing");
    const full = (await api("GET", `/ads/${ad.slug}`)).data;
    if (full.custom_fields?.length) assert(txt.includes("Specifications"), "specs missing");
    assert(await page.locator(`main a[href="/seller/${full.seller.id}"]`).count(), "seller link missing");
    const related = (await api("GET", `/ads/${ad.slug}/related`)).data;
    if (related.length) assert(txt.includes("Related Listings"), "related missing");
    const imgs = await page.locator("main img").count();
    return `${ad.title}: ${full.images?.length ?? 0} imgs(api) ${imgs} imgs(dom), ${full.custom_fields?.length ?? 0} specs, ${related.length} related`;
  });

  await step(page, "seller profile", async () => {
    await page.goto(`${BASE}/seller/2`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    const p = (await api("GET", "/sellers/2")).data;
    const txt = await page.locator("main").innerText();
    assert(txt.includes(p.seller.name), "name");
    assert(txt.includes("Live Ads"), "ads section");
    return `${p.seller.name}, ${p.live_ads} live ads`;
  });

  await step(page, "blog list + detail", async () => {
    await page.goto(`${BASE}/blog`);
    await settle(page);
    const href = await page.locator('main a[href^="/blog/"]').first().getAttribute("href");
    assert(href, "no blog posts");
    await page.locator(`main a[href="${href}"]`).first().click();
    await page.waitForURL((u) => u.pathname === href);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    const post = (await api("GET", `/blog/${href.split("/").pop()}`)).data;
    assert((await page.locator("main h1").innerText()).includes(post.title), "title mismatch");
    return post.title;
  });

  await step(page, "jobs list + detail", async () => {
    await page.goto(`${BASE}/jobs`);
    await settle(page);
    const href = await page.locator('main a[href^="/jobs/"]').first().getAttribute("href");
    assert(href, "no jobs");
    await page.goto(`${BASE}${href}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    assert(await page.getByRole("button", { name: "Apply Now" }).count(), "apply button");
    return (await page.locator("main h1").innerText()).trim();
  });

  for (const key of ["about", "terms", "privacy", "contact"]) {
    await step(page, `cms page /page/${key}`, async () => {
      await page.goto(`${BASE}/page/${key}`);
      await page.waitForSelector("main h1", { timeout: 30000 });
      await settle(page);
      const p = (await api("GET", `/pages/${key}`)).data;
      const h1 = (await page.locator("main h1").innerText()).trim();
      assert(h1 === (p.title ?? p.name), `h1 "${h1}"`);
      const body = (await page.locator("main").innerText()).length;
      assert(body > h1.length + 20, "empty body");
      return `${h1} (${body} chars)`;
    });
  }

  await step(page, "nearby (geolocation)", async () => {
    await page.goto(`${BASE}/nearby`);
    await settle(page, 2500);
    const total = (await api("GET", "/ads/nearby?latitude=23.2419&longitude=69.6669&radius=25&per_page=40")).meta.pagination.total;
    const cards = await page.locator('main a[href^="/ad/"]').count();
    if (total) assert(cards > 0, "no cards though API has results");
    await page.getByRole("button", { name: "250 km" }).click();
    await settle(page, 1500);
    return `${total} within 25km (api), ${cards} cards`;
  });

  await step(page, "sitemap.xml + robots.txt", async () => {
    const sm = await page.request.get(`${BASE}/sitemap.xml`);
    const rb = await page.request.get(`${BASE}/robots.txt`);
    const smt = await sm.text();
    const rbt = await rb.text();
    assert(sm.status() === 200 && smt.includes("<urlset"), "sitemap");
    assert(rb.status() === 200 && /sitemap/i.test(rbt), "robots");
    return `${(smt.match(/<url>/g) ?? []).length} urls; robots ${rbt.length}B`;
  });

  await step(page, "unknown route → 404 page", async () => {
    await page.goto(`${BASE}/this-does-not-exist-${stamp}`);
    await settle(page);
    return (await page.locator("body").innerText()).slice(0, 60).replace(/\s+/g, " ");
  });
  await ctx.close();
}

// =====================================================================================
// AUTH (new account) + new-user seller flow + account features
// =====================================================================================
let newUserId = null;
if (run("auth")) {
  const { ctx, page } = await newCtx("newuser");
  page.expected = (u, s) => s === 422 && /otp\/verify|password\/reset/.test(u);

  await step(page, "register new account (UI)", async () => {
    await page.goto(`${BASE}/register`);
    await settle(page, 300);
    await page.getByLabel("Full name").fill(`QA Web ${stamp}`);
    await page.getByLabel("Email", { exact: true }).fill(NEW_EMAIL);
    await page.getByLabel("Password").fill(NEW_PW);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/verify-otp/, { timeout: 30000 });
    const me = (await api("GET", "/auth/me", await signIn(NEW_EMAIL, NEW_PW))).data;
    newUserId = me.id;
    state.created.push(`user #${me.id} ${NEW_EMAIL}`);
    return `user #${me.id}`;
  });

  await step(page, "verify OTP with debug code", async () => {
    const code = await page.getByLabel("Verification code").inputValue();
    assert(/^\d{4,8}$/.test(code), `debug code not prefilled: "${code}"`);
    await page.getByRole("button", { name: "Verify" }).click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 30000 });
    const me = (await api("GET", "/auth/me", await signIn(NEW_EMAIL, NEW_PW))).data;
    assert(me.email_verified === true, `email_verified=${me.email_verified}`);
    return `code ${code}, email_verified=true`;
  });

  await step(page, "logout via header menu → dashboard redirects to /login", async () => {
    await settle(page, 300);
    await uiLogout(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL(/\/login\?next=%2Fdashboard/, { timeout: 20000 });
    const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("firebase:authUser")).length);
    assert(stored === 0, `firebase session still persisted (${stored})`);
    return page.url().replace(BASE, "");
  });

  await step(page, "login (UI) with new account", async () => {
    await uiLogin(page, NEW_EMAIL, NEW_PW);
    return page.url().replace(BASE, "");
  });

  await step(page, "login: wrong password shows error", async () => {
    await uiLogout(page);
    page.expected = (u, s) => s === 422;
    await page.goto(`${BASE}/login`);
    await settle(page, 300);
    await page.getByLabel("Email or phone").fill(NEW_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText(/do not match/i).waitFor({ timeout: 20000 });
    page.expected = (u, s) => s === 422 && /otp\/verify|password\/reset/.test(u);
    return "error shown";
  });

  await step(page, "forgot password + reset with debug code", async () => {
    await page.goto(`${BASE}/forgot-password`);
    await settle(page, 300);
    await page.getByLabel("Email or phone").fill(NEW_EMAIL);
    await page.getByRole("button", { name: "Send reset code" }).click();
    await page.getByLabel("Reset code").waitFor({ timeout: 20000 });
    const code = await page.getByLabel("Reset code").inputValue();
    assert(code, "debug code not prefilled");
    await page.getByLabel("New password").fill(NEW_PW2);
    await page.getByRole("button", { name: "Reset password" }).click();
    await page.waitForURL(/\/login/, { timeout: 30000 });
    return `code ${code}`;
  });

  await step(page, "login with new password", async () => {
    await uiLogin(page, NEW_EMAIL, NEW_PW2);
    const old = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCyxVlMPIf4Tn5GExBQ_y3zYUjVsCM6s8M`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: NEW_EMAIL, password: NEW_PW, returnSecureToken: true }) }).then((r) => r.json());
    assert(!old.idToken, "old password still works");
    return "old password rejected, new accepted";
  });

  const newT = () => signIn(NEW_EMAIL, NEW_PW2);
  let newAd = null;

  await step(page, "post ad (new user) with images + custom fields", async () => {
    await page.goto(`${BASE}/post-ad`);
    await settle(page);
    await page.getByLabel("Category").selectOption("2");
    await page.getByText("3. Extra Details").waitFor({ timeout: 20000 });
    const title = `QA-WEB new-user car ${stamp}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Description").fill("QA web automation listing. Single owner, full service history, no accidents.");
    await page.getByLabel("Price", { exact: true }).fill("15250.50");
    await page.getByLabel("Price type").selectOption("negotiable");
    await page.getByLabel("Condition").selectOption("used");
    await page.getByLabel("Phone", { exact: true }).fill("+15550001111");
    await page.getByLabel(/^Brand/).fill("QA Motors");
    await page.getByLabel(/^Model Year/).fill("2020");
    await page.getByLabel(/^Kilometers/).fill("42000");
    await page.getByLabel(/^Fuel Type/).selectOption("diesel");
    await page.getByLabel(/^Transmission/).selectOption("manual");
    const country = page.getByLabel("Country");
    await country.selectOption({ index: 1 });
    await settle(page, 800);
    await page.locator('input[type="file"]').setInputFiles([IMG1, IMG2]);
    await page.getByRole("button", { name: "Publish Ad" }).click();
    await page.waitForURL(/\/dashboard\/ads$/, { timeout: 60000 });
    const mine = (await api("GET", "/my/ads", await newT())).data;
    newAd = mine.find((a) => a.title === title);
    assert(newAd, "ad not in /my/ads");
    state.created.push(`ad #${newAd.id} "${title}"`);
    const full = (await api("GET", `/ads/${newAd.id}`, await newT())).data;
    const cf = Object.fromEntries(full.custom_fields.map((f) => [f.code, String(f.value)]));
    assert(full.images.length === 2, `images=${full.images.length}`);
    assert(cf.vehicle_brand === "QA Motors" && cf.fuel_type === "diesel" && cf.transmission === "manual" && cf.kilometers === "42000", `cf=${JSON.stringify(cf)}`);
    assert(full.price === 1525050 && full.price_type === "negotiable" && full.condition === "used", "price/type/condition");
    return `ad #${newAd.id} status=${full.status}, 2 images, cf ok, price ${full.price_display}`;
  });

  await step(page, "my ads shows the pending ad", async () => {
    await page.goto(`${BASE}/dashboard/ads`);
    await settle(page);
    const row = page.locator("div.rounded-2xl.p-3", { hasText: newAd.title });
    await row.waitFor({ timeout: 20000 });
    const txt = await row.innerText();
    assert(/pending|approved/.test(txt), txt);
    assert(await row.locator("img").count(), "thumbnail missing");
    return txt.split("\n").slice(0, 2).join(" | ");
  });

  await step(page, "admin approves ad (API) → public detail page", async () => {
    const r = await api("POST", `/admin/ads/${newAd.id}/approve`, adminT, {});
    assert(r.success, `approve: ${r.status} ${r.message}`);
    await page.goto(`${BASE}/ad/${newAd.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page, 1500);
    const txt = await page.locator("main").innerText();
    assert(txt.includes("Specifications") && txt.includes("QA Motors") && txt.includes("diesel"), "specs not shown");
    const imgs = await page.locator("main img").count();
    assert(imgs >= 1, "no gallery images");
    return `approved; ${imgs} imgs on detail`;
  });

  await step(page, "edit ad: form pre-filled", async () => {
    await page.goto(`${BASE}/dashboard/ads`);
    await settle(page);
    await page.locator("div.rounded-2xl.p-3", { hasText: newAd.title }).getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(new RegExp(`/dashboard/ads/${newAd.id}/edit`));
    await page.locator('input[name="title"]').waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('input[name="title"]')?.value, null, { timeout: 20000 });
    const vals = {
      title: await page.locator('input[name="title"]').inputValue(),
      price: await page.locator('input[name="price"]').inputValue(),
      type: await page.locator('select[name="price_type"]').inputValue(),
      cond: await page.locator('select[name="condition"]').inputValue(),
      brand: await page.getByLabel(/^Brand/).inputValue(),
      fuel: await page.getByLabel(/^Fuel Type/).inputValue(),
      imgs: await page.locator("form img").count(),
    };
    assert(vals.title === newAd.title && vals.price === "15250.5" && vals.type === "negotiable" && vals.cond === "used" && vals.brand === "QA Motors" && vals.fuel === "diesel" && vals.imgs === 2, JSON.stringify(vals));
    return JSON.stringify(vals);
  });

  await step(page, "edit ad: save changes persisted", async () => {
    await page.locator('input[name="title"]').fill(`${newAd.title} edited`);
    await page.locator('input[name="price"]').fill("14999");
    await page.getByLabel(/^Kilometers/).fill("43000");
    await page.getByLabel(/^Fuel Type/).selectOption("petrol");
    // remove the 2nd image, upload one more
    await page.locator("form").getByRole("button", { name: "Remove" }).nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll("form img").length === 1, null, { timeout: 20000 });
    await page.locator('form input[type="file"]').setInputFiles([IMG2]);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/\/dashboard\/ads$/, { timeout: 60000 });
    const full = (await api("GET", `/ads/${newAd.id}`, await newT())).data;
    const cf = Object.fromEntries(full.custom_fields.map((f) => [f.code, String(f.value)]));
    assert(full.title === `${newAd.title} edited`, full.title);
    assert(full.price === 1499900, `price ${full.price}`);
    assert(cf.kilometers === "43000" && cf.fuel_type === "petrol" && cf.vehicle_brand === "QA Motors", JSON.stringify(cf));
    assert(full.images.length === 2, `images ${full.images.length}`);
    newAd = full;
    return `status after edit=${full.status}`;
  });

  await step(page, "mark sold (UI) persisted", async () => {
    await page.goto(`${BASE}/dashboard/ads`);
    await settle(page);
    const row = page.locator("div.rounded-2xl.p-3", { hasText: newAd.title });
    await row.getByRole("button", { name: "Mark sold" }).click();
    await waitFor(async () => (await api("GET", `/ads/${newAd.id}`, await newT())).data.status === "sold", 20000, "status sold");
    await row.getByText("sold", { exact: true }).waitFor({ timeout: 15000 });
    return "status=sold";
  });

  await step(page, "renew (UI) persisted", async () => {
    const before = (await api("GET", `/ads/${newAd.id}`, await newT())).data;
    const row = page.locator("div.rounded-2xl.p-3", { hasText: newAd.title });
    await row.getByRole("button", { name: "Renew" }).click();
    const after = await waitFor(async () => {
      const a = (await api("GET", `/ads/${newAd.id}`, await newT())).data;
      return a.status !== "sold" ? a : null;
    }, 20000, "renewed status");
    return `${before.status} → ${after.status}`;
  });

  await step(page, "verification submission with image", async () => {
    await page.goto(`${BASE}/dashboard/verification`);
    await settle(page);
    await page.locator('select[name="document_type"]').selectOption("passport");
    await page.locator('input[name="document_number"]').fill(`QA${stamp}`);
    await page.locator('input[name="front_image"]').setInputFiles(IMG1);
    await page.locator('input[name="selfie_image"]').setInputFiles(IMG2);
    await page.getByRole("button", { name: "Submit for verification" }).click();
    await page.getByText("Pending review").waitFor({ timeout: 30000 });
    const v = (await api("GET", "/verification", await newT())).data;
    assert(v.request?.status === "pending", JSON.stringify(v));
    state.verificationId = v.request.id;
    return `request #${v.request.id} pending`;
  });

  await step(page, "job apply", async () => {
    const job = (await api("GET", "/jobs?per_page=5")).data[0];
    await page.goto(`${BASE}/jobs/${job.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    page.dialogAnswer = "QA web automation cover letter.";
    await page.getByRole("button", { name: "Apply Now" }).click();
    await page.getByText(/Application submitted/).waitFor({ timeout: 20000 });
    const apps = (await api("GET", "/my/applications", await newT())).data;
    assert(apps.some((a) => Number(a.job_listing_id ?? a.job?.id) === job.id), JSON.stringify(apps).slice(0, 200));
    await page.goto(`${BASE}/dashboard/applications`);
    await settle(page);
    assert((await page.locator("main").innerText()).includes(job.title), "not listed in dashboard");
    return `applied to "${job.title}"`;
  });

  await step(page, "profile update: name + avatar", async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await settle(page);
    await page.getByLabel("Full name").fill(`QA Web Renamed ${stamp}`);
    await page.locator('input[name="avatar"]').setInputFiles(IMG1);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Profile updated.").waitFor({ timeout: 30000 });
    const me = (await api("GET", "/auth/me", await newT())).data;
    assert(me.name === `QA Web Renamed ${stamp}`, me.name);
    assert(me.avatar_path, "avatar not saved");
    await page.reload();
    await settle(page, 1500);
    assert(await page.locator('button[aria-label="Account menu"] img').count(), "header avatar not shown");
    return `avatar ${me.avatar_path.slice(0, 60)}…`;
  });

  await step(page, "delete ad (UI) persisted", async () => {
    await page.goto(`${BASE}/dashboard/ads`);
    await settle(page);
    const row = page.locator("div.rounded-2xl.p-3", { hasText: newAd.title });
    await row.getByRole("button", { name: "Delete" }).click();
    await row.waitFor({ state: "detached", timeout: 20000 });
    page.expected = (u, s) => s === 404;
    const r = await api("GET", `/ads/${newAd.id}`, await newT());
    assert(r.status === 404, `still exists ${r.status}`);
    state.created.push(`  ↳ ad #${newAd.id} deleted via UI`);
    return "404 after delete";
  });

  state.newT = newT;
  await ctx.close();
}

// =====================================================================================
// SELLER (seller@classiads.test): post ad, approve, featured checkout
// =====================================================================================
let sellerAd = null;
if (run("seller") || run("buyer")) {
  const { ctx, page } = await newCtx("seller");
  await step(page, "seller login + post ad with images/custom fields", async () => {
    await uiLogin(page, "seller@classiads.test", "password");
    await page.goto(`${BASE}/post-ad`);
    await settle(page);
    await page.getByLabel("Category").selectOption("2");
    await page.getByText("3. Extra Details").waitFor({ timeout: 20000 });
    const title = `QA-WEB seller car ${stamp}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Description").fill("QA web automation listing by the seller account, for buyer-flow tests.");
    await page.getByLabel("Price", { exact: true }).fill("9999");
    await page.getByLabel("Condition").selectOption("new");
    await page.getByLabel(/^Brand/).fill("QA Brand");
    await page.getByLabel(/^Model Year/).fill("2024");
    await page.getByLabel(/^Fuel Type/).selectOption("electric");
    await page.locator('input[type="file"]').setInputFiles([IMG1]);
    await page.getByRole("button", { name: "Publish Ad" }).click();
    await page.waitForURL(/\/dashboard\/ads$/, { timeout: 60000 });
    sellerAd = (await api("GET", "/my/ads", sellerT)).data.find((a) => a.title === title);
    assert(sellerAd, "not in my ads");
    state.created.push(`ad #${sellerAd.id} "${title}" (seller)`);
    const r = await api("POST", `/admin/ads/${sellerAd.id}/approve`, adminT, {});
    assert(r.success, `approve ${r.status}`);
    sellerAd = (await api("GET", `/ads/${sellerAd.id}`, sellerT)).data;
    assert(sellerAd.status === "approved", sellerAd.status);
    return `ad #${sellerAd.id} approved`;
  });

  await step(page, "featured-ad checkout (Boost → sandbox)", async () => {
    await page.goto(`${BASE}/dashboard/ads`);
    await settle(page);
    await page.locator("div.rounded-2xl.p-3", { hasText: sellerAd.title }).getByRole("link", { name: /Boost/ }).click();
    await page.waitForURL(/\/checkout\?type=featured/);
    await page.getByText("Featured 7 days").waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: /Featured 7 days/ }).click();
    await page.getByRole("button", { name: /Sandbox/ }).click();
    await page.getByRole("button", { name: /^Pay/ }).click();
    await page.waitForURL(/\/checkout\/result\?status=success/, { timeout: 60000 });
    const ad = (await api("GET", `/ads/${sellerAd.id}`, sellerT)).data;
    assert(ad.is_featured, "ad not featured");
    const tx = (await api("GET", "/transactions", sellerT)).data.find((t) => t.type === "featured_ad" && Number(t.ad?.id ?? t.ad_id) === sellerAd.id);
    assert(tx && tx.status === "completed", `txn ${JSON.stringify(tx)?.slice(0, 200)}`);
    state.created.push(`featured txn #${tx.id} (seller)`);
    return `featured; txn #${tx.id} ${tx.total_display}`;
  });

  await step(page, "seller transactions page lists featured txn", async () => {
    await page.goto(`${BASE}/dashboard/transactions`);
    await settle(page);
    const txt = await page.locator("main").innerText();
    assert(/featured ad/i.test(txt) && txt.includes("completed"), "not listed");
    return "listed";
  });
  state.sellerCtx = { ctx, page };
}

// =====================================================================================
// BUYER (customer@classiads.test)
// =====================================================================================
if (run("buyer") && sellerAd) {
  const { ctx, page } = await newCtx("buyer");
  await step(page, "buyer login", async () => {
    await uiLogin(page, "customer@classiads.test", "password");
    return "ok";
  });

  await step(page, "favorite / unfavorite persisted", async () => {
    await page.goto(`${BASE}/ad/${sellerAd.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    await page.getByRole("button", { name: /Save to favorites/ }).click();
    await page.getByRole("button", { name: /Saved/ }).waitFor({ timeout: 15000 });
    let favs = (await api("GET", "/favorites", custT)).data;
    assert(favs.some((a) => a.id === sellerAd.id), "not in favorites");
    await page.reload();
    await page.getByRole("button", { name: /♥ Saved/ }).waitFor({ timeout: 20000 });
    await page.goto(`${BASE}/dashboard/favorites`);
    await settle(page);
    assert((await page.locator("main").innerText()).includes(sellerAd.title), "not in favorites page");
    await page.goto(`${BASE}/ad/${sellerAd.slug}`);
    await page.getByRole("button", { name: /♥ Saved/ }).click();
    await page.getByRole("button", { name: /Save to favorites/ }).waitFor({ timeout: 15000 });
    favs = (await api("GET", "/favorites", custT)).data;
    assert(!favs.some((a) => a.id === sellerAd.id), "still favorited");
    return "fav → unfav ok (and persisted across reload)";
  });

  await step(page, "start chat from ad + send message", async () => {
    await page.goto(`${BASE}/ad/${sellerAd.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    await page.getByRole("button", { name: /Chat/ }).first().click();
    await page.waitForURL(/\/dashboard\/chat\?c=\d+/, { timeout: 30000 });
    const cid = Number(new URL(page.url()).searchParams.get("c"));
    await page.getByPlaceholder("Type a message…").waitFor({ timeout: 20000 });
    const msg = `QA-WEB hello ${stamp}`;
    await page.getByPlaceholder("Type a message…").fill(msg);
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByText(msg).waitFor({ timeout: 20000 });
    const conv = (await api("GET", `/conversations/${cid}`, custT)).data;
    assert(conv.messages.some((m) => m.body === msg), "message not persisted");
    state.conversationId = cid;
    state.created.push(`conversation #${cid} + message (customer↔seller)`);
    return `conversation #${cid}`;
  });

  await step(page, "make an offer", async () => {
    await page.goto(`${BASE}/ad/${sellerAd.slug}`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    page.dialogAnswer = "8500";
    await page.getByRole("button", { name: /Make an Offer/ }).click();
    await page.getByText("Offer sent!").waitFor({ timeout: 20000 });
    const offers = (await api("GET", `/offers?ad_id=${sellerAd.id}`, custT)).data;
    const o = offers.find((x) => x.amount === 850000 || x.amount_display?.includes("8,500"));
    assert(o, JSON.stringify(offers).slice(0, 300));
    state.created.push(`offer #${o.id} 8500 (customer → seller ad)`);
    return `offer #${o.id} ${o.status}`;
  });

  await step(page, "report ad", async () => {
    await page.getByRole("button", { name: /Report this ad/ }).click();
    await page.locator('select[name="reason"]').selectOption({ index: 1 });
    await page.locator('textarea[name="details"]').fill("QA-WEB automated report — please ignore.");
    await page.getByRole("button", { name: "Submit report" }).click();
    await page.getByText(/Report submitted/).waitFor({ timeout: 20000 });
    const reps = (await api("GET", `/admin/reports?ad_id=${sellerAd.id}`, adminT)).data;
    assert(reps.length, "report not found via admin API");
    state.reportIds = reps.map((r) => r.id);
    state.created.push(`report #${reps.map((r) => r.id).join(",")}`);
    return `report #${reps[0].id}`;
  });

  await step(page, "follow seller (seller page) persisted", async () => {
    await page.goto(`${BASE}/seller/2`);
    await page.waitForSelector("main h1", { timeout: 30000 });
    await settle(page);
    const before = (await api("GET", "/sellers/2", custT)).data.is_following;
    await page.getByRole("button", { name: before ? "Following" : "+ Follow" }).click();
    await page.getByRole("button", { name: before ? "+ Follow" : "Following" }).waitFor({ timeout: 15000 });
    const after = (await api("GET", "/sellers/2", custT)).data.is_following;
    assert(after === !before, "not toggled");
    state.followToggled = true;
    state.followInitial = before;
    await page.reload();
    await page.getByRole("button", { name: after ? "Following" : "+ Follow" }).waitFor({ timeout: 20000 });
    return `${before} → ${after}`;
  });

  await step(page, "leave seller review", async () => {
    await page.getByRole("button", { name: /Write a review/ }).click();
    await page.getByRole("radio", { name: "4 stars" }).click();
    const comment = `QA-WEB review ${stamp}`;
    await page.locator('textarea[name="comment"]').fill(comment);
    await page.getByRole("button", { name: "Submit review" }).click();
    await page.getByText(/review was submitted/).waitFor({ timeout: 20000 });
    await page.getByText(comment).waitFor({ timeout: 20000 });
    const mine = (await api("GET", "/reviews/mine", custT)).data;
    const r = mine.find((x) => x.comment === comment);
    assert(r && r.rating === 4, "review not persisted");
    state.reviewId = r.id;
    state.created.push(`review #${r.id} (customer → seller)`);
    return `review #${r.id}`;
  });

  await step(page, "subscription checkout (sandbox)", async () => {
    await page.goto(`${BASE}/dashboard/subscriptions`);
    await settle(page);
    await page.getByRole("link", { name: "Choose Plan" }).first().click();
    await page.waitForURL(/\/checkout\?type=subscription/);
    await settle(page);
    await page.getByRole("button", { name: /Sandbox/ }).click();
    await page.getByRole("button", { name: /^Pay/ }).click();
    await page.waitForURL(/\/checkout\/result\?status=success/, { timeout: 60000 });
    const active = (await api("GET", "/subscriptions/active", custT)).data;
    assert(active && active.status === "active", JSON.stringify(active));
    await page.goto(`${BASE}/dashboard/subscriptions`);
    await settle(page);
    assert((await page.locator("main").innerText()).includes("Active"), "active badge missing");
    state.created.push(`subscription #${active.id} (${active.package?.name}) for customer`);
    return `${active.package?.name} active`;
  });

  await step(page, "transactions + invoices", async () => {
    await page.goto(`${BASE}/dashboard/transactions`);
    await settle(page);
    const txt = await page.locator("main").innerText();
    const txns = (await api("GET", "/transactions", custT)).data;
    const inv = (await api("GET", "/invoices", custT)).data;
    const t = txns.find((x) => x.type === "subscription" && x.status === "completed");
    assert(t && txt.includes(t.total_display), "subscription txn not listed");
    if (t.invoice?.number) assert(txt.includes(t.invoice.number), "invoice number not shown");
    return `${txns.length} txns, ${inv.length} invoices; latest ${t.invoice?.number ?? "-"}`;
  });

  await step(page, "seller: notifications page + mark all read", async () => {
    const sp = state.sellerCtx.page;
    await sp.goto(`${BASE}/dashboard/notifications`);
    await settle(sp, 1000);
    const txt = await sp.locator("main").innerText();
    assert(/offer|message|review|follower/i.test(txt), "expected new notifications");
    await sp.getByRole("button", { name: "Mark all read" }).click();
    await settle(sp, 1500);
    const c = (await api("GET", "/notifications/unread-count", sellerT)).data;
    const unread = c?.unread_count ?? c?.count ?? c;
    assert(Number(unread) === 0, `unread ${JSON.stringify(c)}`);
    return "all read";
  });

  await step(page, "seller: sees buyer message in chat", async () => {
    const sp = state.sellerCtx.page;
    await sp.goto(`${BASE}/dashboard/chat?c=${state.conversationId}`);
    await sp.getByText(`QA-WEB hello ${stamp}`).waitFor({ timeout: 30000 });
    await sp.getByPlaceholder("Type a message…").fill(`QA-WEB reply ${stamp}`);
    await sp.getByRole("button", { name: "Send" }).click();
    await sp.getByText(`QA-WEB reply ${stamp}`).waitFor({ timeout: 20000 });
    return "reply sent";
  });

  // responsive
  await step(page, "responsive 390px: home / ad / dashboard", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const out = [];
    for (const p of ["/", `/ad/${sellerAd.slug}`, "/dashboard", "/dashboard/ads", "/search", "/post-ad"]) {
      await page.goto(`${BASE}${p}`);
      await settle(page, 1200);
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      await page.screenshot({ path: `${OUT}/mobile-${p.replace(/[^a-z0-9]+/gi, "_") || "home"}.png`, fullPage: true });
      out.push(`${p}=${w}`);
      assert(w <= 392, `horizontal overflow on ${p}: ${w}px`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    return out.join(" ");
  });
  await ctx.close();
}

// =====================================================================================
// CLEANUP
// =====================================================================================
if (run("cleanup") || !ONLY.length) {
  const cl = [];
  if (sellerAd) {
    const r = await api("DELETE", `/ads/${sellerAd.id}`, sellerT);
    cl.push(`DELETE ad #${sellerAd.id}: ${r.status}`);
  }
  for (const id of state.reportIds ?? []) cl.push(`dismiss report #${id}: ${(await api("POST", `/admin/reports/${id}/status`, adminT, { status: "dismissed" })).status}`);
  if (state.reviewId) cl.push(`admin DELETE review #${state.reviewId}: ${(await api("DELETE", `/admin/reviews/${state.reviewId}`, adminT)).status}`);
  if (state.followToggled) {
    const now = (await api("GET", "/sellers/2", custT)).data.is_following;
    if (now !== state.followInitial) cl.push(`restore follow: ${(await api("POST", "/sellers/2/follow", custT)).status}`);
  }
  if (state.verificationId) cl.push(`reject verification #${state.verificationId}: ${(await api("POST", `/admin/verifications/${state.verificationId}/reject`, adminT, { reason: "QA cleanup" })).status}`);
  if (state.newT) {
    const t = await state.newT().catch(() => null);
    if (t) cl.push(`DELETE /auth/account (${NEW_EMAIL}): ${(await call("DELETE", "/auth/account", { token: t, body: { password: NEW_PW2 } })).status}`);
  }
  state.cleanupLog = cl;
}
if (state.sellerCtx) await state.sellerCtx.ctx.close();
await browser.close();

console.log("\n==== RESULTS ====");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
console.log(`\nCreated:\n  ${state.created.join("\n  ")}`);
console.log(`\nCleanup:\n  ${(state.cleanupLog ?? []).join("\n  ")}`);
console.log(`\n${problems.length} problem(s)`);
for (const p of problems) console.log("  ", p);
if (state.txt404?.size) console.log(`\nsegment-prefetch .txt 404s (${state.txt404.size}):\n  ${[...state.txt404].slice(0, 15).join("\n  ")}`);
await writeFile(`${OUT}/results.json`, JSON.stringify({ results, problems, created: state.created, cleanup: state.cleanupLog, txt404: [...(state.txt404 ?? [])] }, null, 2));
